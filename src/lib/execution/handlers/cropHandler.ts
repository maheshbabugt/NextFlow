/**
 * src/lib/execution/handlers/cropHandler.ts
 *
 * Crops an image using the HTML5 Canvas API.
 *
 * CORS problem (why previous versions returned the full image):
 * ─────────────────────────────────────────────────────────────
 * When img.crossOrigin = "anonymous" is set but the image server does NOT
 * send Access-Control-Allow-Origin headers, browsers behave inconsistently:
 *   • Chrome/Firefox: canvas is "tainted" → toDataURL() throws SecurityError
 *   • Safari / some CDNs: silently returns the cached non-CORS version,
 *     canvas appears to work but toDataURL() returns a blank or full image
 *
 * Fix: route ALL image loads through /api/image-proxy which fetches the
 * image server-side and re-serves it with Access-Control-Allow-Origin: *.
 * The browser then sees a same-origin response — no taint, no CORS issue.
 */

import type { NodeHandler } from "../types";
import type { CropNodeData } from "@/types/nodes";
import { uploadToTransloadit } from "../uploadToTransloadit";

/* ─── Helper: resolve a numeric param from edge | node field | default ── */
function resolveNum(
  edgeValue: string | undefined,
  nodeField: number | undefined,
  fallback: number,
): number {
  if (edgeValue !== undefined && edgeValue !== "") {
    const v = parseFloat(edgeValue);
    if (!isNaN(v)) return v;
  }
  if (nodeField !== undefined && !isNaN(nodeField)) return nodeField;
  return fallback;
}

/* ─── Helper: load image via proxy (no CORS taint) ──────────────────── */
function loadImageViaProxy(originalUrl: string): Promise<HTMLImageElement> {
  // Route through our Next.js proxy so the browser sees same-origin headers
  const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    // crossOrigin must still be set — the proxy sends ACAO: * so this works
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          `Crop node: failed to load image via proxy.\n` +
          `Original URL: "${originalUrl}"\n` +
          `Proxy URL: "${proxyUrl}"\n` +
          `Check that the URL is a valid, publicly accessible image.`,
        ),
      );
    img.src = proxyUrl;
  });
}

/* ─── Main handler ───────────────────────────────────────────────────── */
export const cropHandler: NodeHandler = async (nodeData, inputs) => {
  const d = nodeData as CropNodeData;

  // ── 1. Resolve image URL ───────────────────────────────────────────
  // Check named handle first, then the "" fallback (edges without targetHandle),
  // then the node's own typed URL.
  const imageUrl =
    inputs.byHandle["image_url"] ??
    inputs.byHandle[""] ??
    d.imageUrl?.trim() ??
    "";

  if (!imageUrl) {
    throw new Error(
      "Crop node: no image URL provided.\n" +
      "Either type a URL into the node or connect an Image node to the image_url handle.",
    );
  }

  // ── 2. Resolve crop percentages ────────────────────────────────────
  const xPct = resolveNum(inputs.byHandle["x_percent"],      d.x,      0);
  const yPct = resolveNum(inputs.byHandle["y_percent"],      d.y,      0);
  const wPct = resolveNum(inputs.byHandle["width_percent"],  d.width,  100);
  const hPct = resolveNum(inputs.byHandle["height_percent"], d.height, 100);

  console.log("[CropNode] params →", { imageUrl, xPct, yPct, wPct, hPct });

  // ── 3. Validate ────────────────────────────────────────────────────
  if ([xPct, yPct, wPct, hPct].some((v) => isNaN(v) || v < 0)) {
    throw new Error(
      `Crop node: negative or NaN parameter — x=${xPct} y=${yPct} w=${wPct} h=${hPct}.`,
    );
  }
  if (wPct > 100 || hPct > 100) {
    throw new Error(`Crop node: w/h cannot exceed 100% — w=${wPct} h=${hPct}.`);
  }
  if (xPct + wPct > 100 || yPct + hPct > 100) {
    throw new Error(
      `Crop node: region out of bounds — x(${xPct})+w(${wPct})=${xPct + wPct}, ` +
      `y(${yPct})+h(${hPct})=${yPct + hPct}. Both must be ≤ 100.`,
    );
  }

  // ── 4. Load image through proxy ────────────────────────────────────
  const img = await loadImageViaProxy(imageUrl);

  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;

  console.log("[CropNode] image dimensions →", { naturalW, naturalH });

  if (naturalW === 0 || naturalH === 0) {
    throw new Error(
      `Crop node: image has zero dimensions (${naturalW}×${naturalH}). ` +
      `The proxy may have returned an error page instead of an image.`,
    );
  }

  // ── 5. % → pixels ─────────────────────────────────────────────────
  // Math.floor keeps us strictly inside bounds (Math.round can push 1px over)
  const srcX = Math.floor((xPct / 100) * naturalW);
  const srcY = Math.floor((yPct / 100) * naturalH);
  const srcW = Math.floor((wPct / 100) * naturalW);
  const srcH = Math.floor((hPct / 100) * naturalH);

  // Clamp: ensure srcX + srcW never exceeds naturalW (float edge cases)
  const cropW = Math.min(srcW, naturalW - srcX);
  const cropH = Math.min(srcH, naturalH - srcY);

  console.log("[CropNode] pixel crop →", { srcX, srcY, cropW, cropH });

  if (cropW <= 0 || cropH <= 0) {
    throw new Error(
      `Crop node: crop area is zero pixels (${cropW}×${cropH}). ` +
      `Image is ${naturalW}×${naturalH}px, origin at (${srcX},${srcY}).`,
    );
  }

  // ── 6. Draw cropped region onto canvas ─────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width  = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Crop node: could not get 2D canvas context.");

  // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  //   sx/sy       = top-left of the SOURCE region to copy
  //   sWidth/sHeight = size of the SOURCE region
  //   dx/dy       = where to place it on the DESTINATION canvas (always 0,0)
  //   dWidth/dHeight = size on the DESTINATION (same → no scaling)
  ctx.drawImage(img, srcX, srcY, cropW, cropH, 0, 0, cropW, cropH);

  // ── 7. Export ──────────────────────────────────────────────────────
  let dataUrl: string;
  try {
    dataUrl = canvas.toDataURL("image/png");
  } catch (e) {
    // SecurityError = canvas is still tainted despite proxy
    throw new Error(
      `Crop node: canvas is tainted (SecurityError). ` +
      `The proxy at /api/image-proxy may not be running or returned wrong headers.\n` +
      `Raw error: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // Detect silent CORS failure (some browsers return "data:," instead of throwing)
  if (!dataUrl || dataUrl === "data:," || dataUrl.length < 100) {
    throw new Error(
      "Crop node: canvas exported an empty/blank image. " +
      "The proxy response may be missing Access-Control-Allow-Origin headers.",
    );
  }

  console.log("[CropNode] success — output dataUrl length:", dataUrl.length);

  // Upload to Transloadit so the output is a real HTTPS URL (shown in node
  // output panel and history sidebar as a clickable link)
  const outputUrl = await uploadToTransloadit(dataUrl, "crop");

  return {
    output: outputUrl,
  };
};

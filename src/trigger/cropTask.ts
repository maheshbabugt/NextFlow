/**
 * src/trigger/cropTask.ts
 *
 * Trigger.dev task: Crop Image using FFmpeg.
 *
 * Steps:
 *   1. Download source image to a temp file
 *   2. Get image dimensions using FFmpeg probe
 *   3. Convert percentage crop params to pixel values
 *   4. Run FFmpeg crop filter: -vf "crop=w:h:x:y"
 *   5. Return output as base64 data URL
 *      (In production: upload to Cloudinary/S3 and return URL)
 *
 * Why FFmpeg for images?
 *   - Handles jpg/png/webp/gif in one tool
 *   - Runs server-side (no CORS issues)
 *   - Same tool used for video frame extraction
 *   - Production-grade, used by major platforms
 */

import { task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { CropTaskPayload, CropTaskResult } from "./types";

// Resolve at runtime — the ffmpeg() build extension sets FFMPEG_PATH and
// FFPROBE_PATH in production. Fall back to npm installers for local dev.
function resolveFfmpeg(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@ffmpeg-installer/ffmpeg").path as string;
  } catch {
    throw new Error("Could not find ffmpeg binary");
  }
}

function resolveFfprobe(): string {
  if (process.env.FFPROBE_PATH) return process.env.FFPROBE_PATH;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@ffprobe-installer/ffprobe").path as string;
  } catch {
    throw new Error("Could not find ffprobe binary");
  }
}

export const cropTask = task({
  id: "crop-image",

  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 5000,
    factor: 2,
  },

  run: async (payload: CropTaskPayload): Promise<CropTaskResult> => {
    const { imageUrl, x, y, width, height } = payload;

    // Set binary paths at runtime (not module load time)
    ffmpeg.setFfmpegPath(resolveFfmpeg());
    ffmpeg.setFfprobePath(resolveFfprobe());

    // ── Validate params ────────────────────────────────────────────
    if (
      [x, y, width, height].some((v) => isNaN(v) || v < 0) ||
      width > 100 ||
      height > 100 ||
      x + width > 100 ||
      y + height > 100
    ) {
      throw new Error(
        `Invalid crop params: x=${x} y=${y} w=${width} h=${height}. ` +
          "All must be 0–100 and x+w ≤ 100, y+h ≤ 100.",
      );
    }

    // ── Create temp directory ──────────────────────────────────────
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextflow-crop-"));
    const inputPath = path.join(tmpDir, "input.jpg");
    const outputPath = path.join(tmpDir, "output.png");

    try {
      // ── Download source image ─────────────────────────────────────
      await downloadFile(imageUrl, inputPath);

      // ── Get image dimensions via FFmpeg probe ─────────────────────
      const { widthPx: srcW, heightPx: srcH } =
        await probeImageDimensions(inputPath);

      // ── Convert % → pixels ────────────────────────────────────────
      // Use Math.floor (not round) so we never exceed image bounds.
      const cropX = Math.floor((x / 100) * srcW);
      const cropY = Math.floor((y / 100) * srcH);
      const cropW = Math.floor((width  / 100) * srcW);
      const cropH = Math.floor((height / 100) * srcH);

      // Clamp to image bounds — guards against floating-point edge cases
      // where cropX + cropW could exceed srcW by 1px, causing FFmpeg to
      // silently fall back to outputting the full image.
      const clampedW = Math.min(cropW, srcW - cropX);
      const clampedH = Math.min(cropH, srcH - cropY);

      if (clampedW <= 0 || clampedH <= 0) {
        throw new Error(
          `Crop area is zero pixels (${clampedW}×${clampedH}). ` +
          `Image is ${srcW}×${srcH}px, crop starts at (${cropX},${cropY}). Check your percentages.`,
        );
      }

      // ── Run FFmpeg crop ───────────────────────────────────────────
      // Filter syntax: crop=out_w:out_h:x:y
      // out_w and out_h are the OUTPUT dimensions (not the source region size —
      // they are the same here since we're not scaling).
      await runFFmpegCrop(inputPath, outputPath, clampedW, clampedH, cropX, cropY);

      // ── Upload to Transloadit and return permanent URL ────────────
      const outputBuffer = fs.readFileSync(outputPath);
      const base64 = outputBuffer.toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;
      const outputUrl = await uploadToTransloadit(dataUrl);

      return { outputUrl, widthPx: clampedW, heightPx: clampedH };
    } finally {
      // Always clean up temp files
      try {
        fs.rmSync(tmpDir, { recursive: true });
      } catch {
        /* ignore */
      }
    }
  },
});

/* ─── Helpers ────────────────────────────────────────────────────────── */

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status}): ${url}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

function probeImageDimensions(
  filePath: string,
): Promise<{ widthPx: number; heightPx: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(new Error(`FFprobe failed: ${err.message}`));
      const stream = metadata.streams.find(
        (s) => s.codec_type === "video" || s.width,
      );
      if (!stream?.width || !stream?.height) {
        return reject(new Error("Could not determine image dimensions"));
      }
      resolve({ widthPx: stream.width, heightPx: stream.height });
    });
  });
}

function runFFmpegCrop(
  inputPath: string,
  outputPath: string,
  cropW: number,
  cropH: number,
  cropX: number,
  cropY: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilter(`crop=${cropW}:${cropH}:${cropX}:${cropY}`)
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) =>
        reject(new Error(`FFmpeg crop failed: ${err.message}`)),
      )
      .run();
  });
}

async function uploadToTransloadit(dataUrl: string): Promise<string> {
  const key    = process.env.TRANSLOADIT_KEY    ?? process.env.NEXT_PUBLIC_TRANSLOADIT_KEY ?? "";
  const secret = process.env.TRANSLOADIT_SECRET ?? "";
  if (!key || !secret) return dataUrl; // fallback to base64 in dev

  const crypto = await import("crypto");
  const base64Data  = dataUrl.split(",")[1];
  const imageBuffer = Buffer.from(base64Data, "base64");

  const params = JSON.stringify({
    auth: {
      key,
      expires: new Date(Date.now() + 5 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "+00:00"),
    },
    template_id: "a6565dbca12749daaae1dbd70771a3cf",
  });

  const signature = crypto.default
    .createHmac("sha384", secret)
    .update(Buffer.from(params, "utf-8"))
    .digest("hex");

  const form = new FormData();
  form.append("params",    params);
  form.append("signature", `sha384:${signature}`);
  form.append("file", new Blob([imageBuffer], { type: "image/png" }), `crop-${Date.now()}.png`);

  const res      = await fetch("https://api2.transloadit.com/assemblies", { method: "POST", body: form, signal: AbortSignal.timeout(30_000) });
  const assembly = await res.json();
  if (!res.ok || assembly.error) throw new Error(`Transloadit: ${assembly.error ?? res.status}`);

  const results = assembly.results?.[":original"] ?? assembly.results?.original ?? [];
  const fromResults: string | undefined = Array.isArray(results) && results.length > 0 ? results[0]?.ssl_url : undefined;
  const uploads = assembly.uploads ?? [];
  const fromUploads: string | undefined = Array.isArray(uploads) && uploads.length > 0 ? uploads[0]?.ssl_url : undefined;
  const url = fromResults ?? fromUploads;
  if (!url) throw new Error("Transloadit: no ssl_url returned");
  return url;
}

import type { NodeHandler } from "../types";
import type { ExtractNodeData } from "@/types/nodes";
import { uploadToTransloadit } from "../uploadToTransloadit";

export const extractHandler: NodeHandler = async (nodeData, inputs) => {
  const d = nodeData as ExtractNodeData;

  const videoUrl     = inputs.byHandle["video_url"] ?? d.videoUrl?.trim()    ?? "";
  const rawTimestamp = inputs.byHandle["timestamp"]  ?? d.timestamp?.trim()  ?? "0";

  if (!videoUrl) {
    throw new Error("Extract node: no video URL provided or connected.");
  }

  const video = await loadMetadata(videoUrl);

  const duration = video.duration;
  if (!isFinite(duration) || duration <= 0) {
    throw new Error("Extract node: could not determine video duration.");
  }

  let seekTime: number;
  if (rawTimestamp.endsWith("%")) {
    const pct = parseFloat(rawTimestamp) / 100;
    if (isNaN(pct)) throw new Error(`Extract node: invalid percentage "${rawTimestamp}".`);
    seekTime = duration * Math.max(0, Math.min(1, pct));
  } else {
    const parsed = parseFloat(rawTimestamp);
    if (isNaN(parsed)) throw new Error(`Extract node: invalid timestamp "${rawTimestamp}". Use seconds or percentage.`);
    seekTime = Math.max(0, Math.min(parsed, duration - 0.001));
  }

  await seekTo(video, seekTime);

  const canvas = document.createElement("canvas");
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Extract node: could not get canvas 2D context.");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  let dataUrl: string;
  try {
    dataUrl = canvas.toDataURL("image/png");
  } catch {
    // Canvas tainted — fall back to proxy with cache-bust
    video.pause();
    video.removeAttribute("src");
    video.load();
    return extractViaProxy(videoUrl, rawTimestamp, duration);
  }

  if (!dataUrl || dataUrl === "data:," || dataUrl.length < 100) {
    throw new Error("Extract node: captured frame is blank.");
  }

  video.pause();
  video.removeAttribute("src");
  video.load();

  const outputUrl = await uploadToTransloadit(dataUrl, "frame");
  return { output: outputUrl };
};

// Fallback: if direct load taints the canvas, fetch via proxy
async function extractViaProxy(
  videoUrl: string,
  rawTimestamp: string,
  duration: number,
): Promise<{ output: string }> {
  const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(videoUrl)}`;
  const video = await loadMetadata(proxyUrl);

  let seekTime: number;
  if (rawTimestamp.endsWith("%")) {
    seekTime = duration * (parseFloat(rawTimestamp) / 100);
  } else {
    seekTime = Math.max(0, Math.min(parseFloat(rawTimestamp) || 0, duration - 0.001));
  }

  await seekTo(video, seekTime);

  const canvas = document.createElement("canvas");
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 360;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/png");
  if (!dataUrl || dataUrl === "data:," || dataUrl.length < 100) {
    throw new Error("Extract node: captured frame is blank even via proxy.");
  }

  video.pause();
  video.removeAttribute("src");
  video.load();

  const outputUrl = await uploadToTransloadit(dataUrl, "frame");
  return { output: outputUrl };
}

function loadMetadata(url: string, viaProxy = false): Promise<HTMLVideoElement> {
  const src = viaProxy ? `/api/image-proxy?url=${encodeURIComponent(url)}` : url;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const timeout = setTimeout(() => {
      cleanup();
      if (!viaProxy) {
        loadMetadata(url, true).then(resolve).catch(reject);
      } else {
        reject(new Error(`Extract node: failed to load video from "${url}".`));
      }
    }, 15_000);

    const cleanup = () => {
      clearTimeout(timeout);
      video.oncanplay = null;
      video.onerror = null;
    };

    video.oncanplay = () => { cleanup(); resolve(video); };
    video.onerror = () => {
      cleanup();
      // Direct load failed (e.g. CORS blocked by host) — retry via proxy
      if (!viaProxy) {
        loadMetadata(url, true).then(resolve).catch(reject);
      } else {
        reject(new Error(`Extract node: failed to load video from "${url}".`));
      }
    };

    video.src = src;
    video.load();
  });
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Extract node: seek to ${time.toFixed(2)}s timed out.`));
    }, 20_000);

    const cleanup = () => {
      clearTimeout(timeout);
      video.onseeked = null;
      video.onerror  = null;
    };

    video.onseeked = () => {
      cleanup();
      // Force the browser to actually decode the frame at this position
      // by playing for one frame then pausing. Without this, preload="metadata"
      // causes seeked to fire immediately without decoding the actual frame.
      const playPromise = video.play();
      if (playPromise) {
        playPromise
          .then(() => {
            video.pause();
            resolve();
          })
          .catch(() => resolve()); // play() blocked — still resolve, frame may be ok
      } else {
        resolve();
      }
    };
    video.onerror  = () => { cleanup(); reject(new Error("Extract node: seek error.")); };
    video.currentTime = time;
  });
}

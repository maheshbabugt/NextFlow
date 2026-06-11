/**
 * src/trigger/extractTask.ts
 *
 * Trigger.dev task: Extract a frame from a video using FFmpeg.
 *
 * Steps:
 *   1. Download the video to a temp file
 *   2. If timestamp is a percentage ("50%"), probe video duration first
 *   3. Run FFmpeg: -ss <seconds> -vframes 1 output.png
 *   4. Return output as base64 PNG data URL
 *
 * FFmpeg command equivalent:
 *   ffmpeg -ss 5.0 -i input.mp4 -vframes 1 -q:v 2 output.png
 */

import { task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { ExtractTaskPayload, ExtractTaskResult } from "./types";

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

export const extractTask = task({
  id: "extract-frame",

  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 8000,
    factor: 2,
  },

  run: async (payload: ExtractTaskPayload): Promise<ExtractTaskResult> => {
    const { videoUrl, timestamp } = payload;

    // Set binary paths at runtime (not module load time)
    ffmpeg.setFfmpegPath(resolveFfmpeg());
    ffmpeg.setFfprobePath(resolveFfprobe());

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextflow-extract-"));
    // Detect video extension for correct codec hints
    const ext = getVideoExtension(videoUrl);
    const inputPath = path.join(tmpDir, `input.${ext}`);
    const outputPath = path.join(tmpDir, "frame.png");

    try {
      // ── Download video ────────────────────────────────────────────
      await downloadFile(videoUrl, inputPath);

      // ── Resolve timestamp ─────────────────────────────────────────
      let seekSeconds: number;

      if (typeof timestamp === "string" && timestamp.endsWith("%")) {
        // Probe video duration, then calculate seek time
        const duration = await getVideoDuration(inputPath);
        const pct = parseFloat(timestamp) / 100;
        seekSeconds = duration * Math.max(0, Math.min(1, pct));
      } else {
        seekSeconds = Math.max(0, parseFloat(String(timestamp)) || 0);
      }

      // ── Extract frame with FFmpeg ─────────────────────────────────
      await runFFmpegExtract(inputPath, outputPath, seekSeconds);

      // ── Encode and upload result ──────────────────────────────────
      const buffer = fs.readFileSync(outputPath);
      const base64 = buffer.toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;
      const outputUrl = await uploadToTransloadit(dataUrl);

      return {
        outputUrl,
        resolvedTimestampSeconds: seekSeconds,
      };
    } finally {
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
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) {
    throw new Error(`Failed to download video (${res.status}): ${url}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(new Error(`FFprobe failed: ${err.message}`));
      const duration = metadata.format.duration;
      if (!duration || duration <= 0) {
        return reject(new Error("Could not determine video duration"));
      }
      resolve(duration);
    });
  });
}

function runFFmpegExtract(
  inputPath: string,
  outputPath: string,
  seekSeconds: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      // -ss BEFORE -i for fast seeking (keyframe seek)
      .inputOption(`-ss ${seekSeconds.toFixed(3)}`)
      // Extract exactly 1 frame
      .outputOptions(["-vframes 1", "-q:v 2"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) =>
        reject(new Error(`FFmpeg extract failed: ${err.message}`)),
      )
      .run();
  });
}

function getVideoExtension(url: string): string {
  const match = url.split("?")[0].match(/\.([a-z0-9]+)$/i);
  const ext = match?.[1]?.toLowerCase() ?? "mp4";
  const valid = ["mp4", "mov", "webm", "m4v", "avi", "mkv"];
  return valid.includes(ext) ? ext : "mp4";
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
  form.append("file", new Blob([imageBuffer], { type: "image/png" }), `frame-${Date.now()}.png`);

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

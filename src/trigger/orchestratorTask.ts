/**
 * src/trigger/orchestratorTask.ts
 *
 * Trigger.dev parent task that orchestrates the workflow DAG.
 *
 * IMPORTANT: Trigger.dev does NOT support parallel triggerAndWait calls
 * (Promise.all with multiple triggerAndWait). To avoid this, crop and
 * extract logic is inlined directly here instead of calling child tasks.
 * Only LLM calls use triggerAndWait since they are always in their own wave.
 */

import { task } from "@trigger.dev/sdk/v3";
import {
  buildWaves,
  collectUpstreamDeps,
  topologicalSortPlain,
} from "@/lib/graphUtils";
import type { AnyFlowNode, ExecutionScope } from "@/types/nodes";
import type { Edge } from "@xyflow/react";
import type {
  LLMTaskPayload,
  LLMTaskResult,
} from "./types";
import { llmTask } from "./llmTask";

// Server-side imports for crop/extract (inlined to avoid triggerAndWait parallelism)
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface OrchestratorPayload {
  nodes: AnyFlowNode[];
  edges: Edge[];
  scope: ExecutionScope;
  existingOutputs?: Record<string, string>;
}

export interface NodeEvent {
  type: "status" | "output" | "error" | "done" | "wave_start";
  nodeId?: string;
  status?: string;
  output?: string;
  error?: string;
  summary?: { succeeded: number; failed: number; skipped: number };
  waveIndex?: number;
  nodeCount?: number;
}

export interface OrchestratorResult {
  events: NodeEvent[];
  outputs: Record<string, string>;
}

export const orchestratorTask = task({
  id: "workflow-orchestrator",
  maxDuration: 3600,

  run: async (payload: OrchestratorPayload): Promise<OrchestratorResult> => {
    const { nodes, edges, scope, existingOutputs } = payload;

    const events: NodeEvent[] = [];
    const emit = (e: NodeEvent) => events.push(e);

    const nodesToRun = resolveScope(nodes, edges, scope);
    const runIds = new Set(nodesToRun.map((n) => n.id));
    const subEdges = edges.filter(
      (e) => runIds.has(e.source) && runIds.has(e.target),
    );
    const sorted = topologicalSortPlain(nodesToRun, subEdges);
    const waves = buildWaves(sorted, subEdges);

    const outputs = new Map<string, string>(
      existingOutputs ? Object.entries(existingOutputs) : [],
    );
    const failed = new Set<string>();
    const skipped = new Set<string>();

    for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
      const wave = waves[waveIndex];

      emit({ type: "wave_start", waveIndex, nodeCount: wave.length });

      // Emit "running" for all nodes in this wave at once
      for (const node of wave) {
        const incoming = subEdges.filter((e) => e.target === node.id);
        if (!incoming.some((e) => failed.has(e.source))) {
          emit({ type: "status", nodeId: node.id, status: "running" });
        }
      }

      // Execute nodes sequentially within the wave (Trigger.dev limitation)
      for (const node of wave) {
        await runNode(node as AnyFlowNode, subEdges, outputs, failed, skipped, emit);
      }
    }

    emit({
      type: "done",
      nodeId: "__orchestrator__",
      summary: { succeeded: outputs.size, failed: failed.size, skipped: skipped.size },
    });

    return { events, outputs: Object.fromEntries(outputs) };
  },
});

/* ─── Node runner ────────────────────────────────────────────────────── */

async function runNode(
  node: AnyFlowNode,
  allEdges: Edge[],
  outputs: Map<string, string>,
  failed: Set<string>,
  skipped: Set<string>,
  emit: (e: NodeEvent) => void,
) {
  const { id } = node;
  const incoming = allEdges.filter((e) => e.target === id);

  if (incoming.some((e) => failed.has(e.source))) {
    skipped.add(id);
    emit({ type: "status", nodeId: id, status: "skipped" });
    return;
  }

  try {
    const output = await dispatchNode(node, allEdges, outputs);
    outputs.set(id, output);
    emit({ type: "output", nodeId: id, output });
    emit({ type: "status", nodeId: id, status: "success" });
  } catch (err) {
    failed.add(id);
    emit({ type: "error", nodeId: id, error: (err as Error).message });
    emit({ type: "status", nodeId: id, status: "error" });
  }
}

/* ─── Dispatch ───────────────────────────────────────────────────────── */

async function dispatchNode(
  node: AnyFlowNode,
  allEdges: Edge[],
  outputs: Map<string, string>,
): Promise<string> {
  const d = node.data as Record<string, unknown>;

  const byHandle: Record<string, string> = {};
  const images: string[] = [];
  for (const edge of allEdges.filter((e) => e.target === node.id)) {
    const val = outputs.get(edge.source);
    if (val === undefined) continue;
    const handle = edge.targetHandle ?? "";
    if (handle === "images") images.push(val);
    else byHandle[handle] = val;
  }

  switch (node.type) {
    case "text":
      return String(d.text ?? "");

    case "image":
      return String(d.imageUrl ?? "");

    case "video":
      return String(d.videoUrl ?? "");

    case "llm": {
      // LLM is always alone in its wave (depends on crop/extract/text),
      // so triggerAndWait is safe here — no parallelism issue.
      const systemPrompt = byHandle["system_prompt"] ?? String(d.systemPrompt ?? "");
      const userMessage  = byHandle["user_message"]  ?? String(d.userMessage  ?? "");
      if (!userMessage && !systemPrompt) {
        throw new Error("LLM node: connect a Text node or type a user message.");
      }
      const llmPayload: LLMTaskPayload = {
        model: String(d.model ?? "openai/gpt-5.4-nano"),
        systemPrompt,
        userMessage,
        imageUrls: images,
      };
      const result = await llmTask.triggerAndWait(llmPayload);
      if (!result.ok) throw new Error(`LLM task failed: ${result.error}`);
      return (result.output as LLMTaskResult).output;
    }

    case "crop": {
      // Inlined — no triggerAndWait, runs directly in this task
      const imageUrl = byHandle["image_url"] ?? byHandle[""] ?? String(d.imageUrl ?? "");
      if (!imageUrl) throw new Error("Crop node: no image URL provided.");
      const x      = Number(byHandle["x_percent"]      ?? d.x      ?? 0);
      const y      = Number(byHandle["y_percent"]      ?? d.y      ?? 0);
      const width  = Number(byHandle["width_percent"]  ?? d.width  ?? 100);
      const height = Number(byHandle["height_percent"] ?? d.height ?? 100);
      return await runCropInline(imageUrl, x, y, width, height);
    }

    case "extract": {
      // Inlined — no triggerAndWait, runs directly in this task
      const videoUrl  = byHandle["video_url"] ?? String(d.videoUrl  ?? "");
      const timestamp = byHandle["timestamp"] ?? String(d.timestamp ?? "0");
      if (!videoUrl) throw new Error("Extract node: no video URL provided.");
      return await runExtractInline(videoUrl, timestamp);
    }

    default:
      throw new Error(`Unknown node type: "${(node as AnyFlowNode).type}"`);
  }
}

/* ─── Inline Crop (FFmpeg, no child task) ────────────────────────────── */

async function runCropInline(
  imageUrl: string,
  x: number, y: number, width: number, height: number,
): Promise<string> {
  if ([x, y, width, height].some((v) => isNaN(v) || v < 0) ||
      width > 100 || height > 100 || x + width > 100 || y + height > 100) {
    throw new Error(`Invalid crop params: x=${x} y=${y} w=${width} h=${height}.`);
  }

  setupFfmpeg();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nf-crop-"));
  const inputPath  = path.join(tmpDir, "input.jpg");
  const outputPath = path.join(tmpDir, "output.png");

  try {
    await downloadFile(imageUrl, inputPath);
    const { w: srcW, h: srcH } = await probeImageDimensions(inputPath);

    const cropX = Math.floor((x      / 100) * srcW);
    const cropY = Math.floor((y      / 100) * srcH);
    const cropW = Math.min(Math.floor((width  / 100) * srcW), srcW - cropX);
    const cropH = Math.min(Math.floor((height / 100) * srcH), srcH - cropY);

    if (cropW <= 0 || cropH <= 0) {
      throw new Error(`Crop area is zero pixels (${cropW}×${cropH}).`);
    }

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilter(`crop=${cropW}:${cropH}:${cropX}:${cropY}`)
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(new Error(`FFmpeg crop failed: ${err.message}`)))
        .run();
    });

    const dataUrl = `data:image/png;base64,${fs.readFileSync(outputPath).toString("base64")}`;
    return await uploadToTransloadit(dataUrl, "crop");
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  }
}

/* ─── Inline Extract (FFmpeg, no child task) ─────────────────────────── */

async function runExtractInline(videoUrl: string, timestamp: string): Promise<string> {
  setupFfmpeg();
  const ext = videoUrl.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "mp4";
  const validExts = ["mp4", "mov", "webm", "m4v", "avi", "mkv"];
  const safeExt = validExts.includes(ext) ? ext : "mp4";

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nf-extract-"));
  const inputPath  = path.join(tmpDir, `input.${safeExt}`);
  const outputPath = path.join(tmpDir, "frame.png");

  try {
    await downloadFile(videoUrl, inputPath);

    let seekSeconds: number;
    if (typeof timestamp === "string" && timestamp.endsWith("%")) {
      const duration = await getVideoDuration(inputPath);
      seekSeconds = duration * (parseFloat(timestamp) / 100);
    } else {
      seekSeconds = Math.max(0, parseFloat(String(timestamp)) || 0);
    }

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .inputOption(`-ss ${seekSeconds.toFixed(3)}`)
        .outputOptions(["-vframes 1", "-q:v 2"])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(new Error(`FFmpeg extract failed: ${err.message}`)))
        .run();
    });

    const dataUrl = `data:image/png;base64,${fs.readFileSync(outputPath).toString("base64")}`;
    return await uploadToTransloadit(dataUrl, "frame");
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  }
}

/* ─── Shared helpers ─────────────────────────────────────────────────── */

function setupFfmpeg() {
  const ffmpegPath = process.env.FFMPEG_PATH ?? (() => {
    try { return require("@ffmpeg-installer/ffmpeg").path as string; } catch { throw new Error("ffmpeg not found"); }
  })();
  const ffprobePath = process.env.FFPROBE_PATH ?? (() => {
    try { return require("@ffprobe-installer/ffprobe").path as string; } catch { throw new Error("ffprobe not found"); }
  })();
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Failed to download (${res.status}): ${url}`);
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

function probeImageDimensions(filePath: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) return reject(new Error(`FFprobe failed: ${err.message}`));
      const s = meta.streams.find((s) => s.codec_type === "video" || s.width);
      if (!s?.width || !s?.height) return reject(new Error("Could not determine image dimensions"));
      resolve({ w: s.width, h: s.height });
    });
  });
}

function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) return reject(new Error(`FFprobe failed: ${err.message}`));
      const d = meta.format.duration;
      if (!d || d <= 0) return reject(new Error("Could not determine video duration"));
      resolve(d);
    });
  });
}

async function uploadToTransloadit(dataUrl: string, prefix: string): Promise<string> {
  const key    = process.env.TRANSLOADIT_KEY    ?? process.env.NEXT_PUBLIC_TRANSLOADIT_KEY ?? "";
  const secret = process.env.TRANSLOADIT_SECRET ?? "";
  if (!key || !secret) return dataUrl;

  const crypto = await import("crypto");
  const imageBuffer = Buffer.from(dataUrl.split(",")[1], "base64");
  const params = JSON.stringify({
    auth: {
      key,
      expires: new Date(Date.now() + 5 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "+00:00"),
    },
    template_id: "a6565dbca12749daaae1dbd70771a3cf",
  });
  const signature = `sha384:${crypto.default.createHmac("sha384", secret).update(Buffer.from(params, "utf-8")).digest("hex")}`;

  const form = new FormData();
  form.append("params", params);
  form.append("signature", signature);
  form.append("file", new Blob([imageBuffer], { type: "image/png" }), `${prefix}-${Date.now()}.png`);

  const res      = await fetch("https://api2.transloadit.com/assemblies", { method: "POST", body: form, signal: AbortSignal.timeout(30_000) });
  const assembly = await res.json();
  if (!res.ok || assembly.error) throw new Error(`Transloadit: ${assembly.error ?? res.status}`);

  const results  = assembly.results?.[":original"] ?? assembly.results?.original ?? [];
  const uploads  = assembly.uploads ?? [];
  const url = (Array.isArray(results) && results[0]?.ssl_url) ?? (Array.isArray(uploads) && uploads[0]?.ssl_url);
  if (!url) throw new Error("Transloadit: no ssl_url returned");
  return url;
}

/* ─── Scope resolver ─────────────────────────────────────────────────── */

function resolveScope(
  allNodes: AnyFlowNode[],
  allEdges: Edge[],
  scope: ExecutionScope,
): AnyFlowNode[] {
  if (scope.type === "full") return allNodes;
  if (scope.type === "single") return allNodes.filter((n) => n.id === scope.nodeId);
  const ids = collectUpstreamDeps(new Set(scope.nodeIds), allEdges);
  return allNodes.filter((n) => ids.has(n.id));
}

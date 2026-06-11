/**
 * src/trigger/types.ts
 *
 * Shared types between:
 *   - Trigger.dev task files (src/trigger/*.ts)
 *   - API routes that trigger those tasks (src/app/api/*)
 *   - Frontend execution engine (src/lib/execution/)
 *
 * Keep this file import-free from any framework so it can be used anywhere.
 */

/* ─── LLM Task ───────────────────────────────────────────────────────── */

export interface LLMTaskPayload {
  /** e.g. "openai/gpt-5.4-nano" or "mistralai/mistral-small-4" */
  model: string;
  systemPrompt: string;
  userMessage: string;
  /**
   * Image inputs — can be:
   *   - HTTPS URLs (fetched server-side)
   *   - data:image/... base64 strings (from canvas crop)
   */
  imageUrls: string[];
}

export interface LLMTaskResult {
  output: string;
  /** Which provider actually ran ("openrouter") */
  provider: string;
  /** Total tokens used (if available) */
  tokensUsed?: number;
}

/* ─── Crop Image Task ────────────────────────────────────────────────── */

export interface CropTaskPayload {
  /** Public URL of the source image (must be accessible by the task runner) */
  imageUrl: string;
  /** Crop region as percentages (0–100) */
  x: number; // left edge %
  y: number; // top edge %
  width: number; // crop width %
  height: number; // crop height %
}

export interface CropTaskResult {
  /**
   * URL of the cropped image.
   * In production: Cloudinary/S3 URL uploaded by the task.
   * In dev (no upload configured): base64 data URL.
   */
  outputUrl: string;
  /** Pixel dimensions of the cropped result */
  widthPx: number;
  heightPx: number;
}

/* ─── Extract Frame Task ─────────────────────────────────────────────── */

export interface ExtractTaskPayload {
  /** Public URL of the source video */
  videoUrl: string;
  /**
   * When to extract the frame.
   * - Number string: "5" = 5 seconds from start
   * - Percentage string: "50%" = middle of video
   */
  timestamp: string;
}

export interface ExtractTaskResult {
  /** URL or base64 data URL of the extracted frame */
  outputUrl: string;
  /** The actual seek time used (resolved from percentage if needed) */
  resolvedTimestampSeconds: number;
}

/* ─── Generic task runner result wrapper ─────────────────────────────── */

export interface TaskRunResult<T> {
  success: true;
  data: T;
}

export interface TaskRunError {
  success: false;
  error: string;
  retryable: boolean;
}

export type TaskOutcome<T> = TaskRunResult<T> | TaskRunError;

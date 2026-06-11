/**
 * src/lib/execution/handlers/llmHandler.ts
 *
 * LLM node — calls OpenRouter API via a Next.js API route.
 *
 * ── Why go through an API route? ────────────────────────────────────
 * Browser fetch to OpenRouter works, but the API key must NEVER
 * be exposed in client-side code (it would be visible in the bundle).
 * We POST to /api/llm which runs server-side and keeps the key secret.
 *
 * ── Retry logic ─────────────────────────────────────────────────────
 * API calls can fail transiently (rate limit, network blip).
 * We retry up to MAX_RETRIES times with exponential back-off.
 *
 * ── Vision support ──────────────────────────────────────────────────
 * If the "images" handle has connected nodes, each image URL is fetched,
 * converted to base64, and sent as an inline_data part alongside the text.
 */

import type { NodeHandler } from "../types";
import type { LLMNodeData } from "@/types/nodes";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 800; // first retry after 800ms, then 1600ms, then 3200ms

export const llmHandler: NodeHandler = async (nodeData, inputs, signal) => {
  const d = nodeData as LLMNodeData;

  // ── Resolve inputs: prefer connected edge, fall back to manual field ──
  const systemPrompt = inputs.byHandle["system_prompt"] ?? d.systemPrompt ?? "";
  const userMessage = inputs.byHandle["user_message"] ?? d.userMessage ?? "";
  const imageUrls = inputs.images; // array of connected image URLs

  if (!userMessage && !systemPrompt) {
    throw new Error("LLM node: user message or system prompt is required.");
  }

  // ── Build the request payload ─────────────────────────────────────
  const payload = {
    model: d.model ?? "openai/gpt-5.4-nano",
    systemPrompt,
    userMessage,
    imageUrls, // server will fetch + base64-encode these
  };

  // ── Call with retry ───────────────────────────────────────────────
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new Error("Execution cancelled");

    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
        signal,
      });

      if (!res.ok) {
        const body = await res.text();
        // 429 = rate limited → always retry
        if (res.status === 429 || res.status >= 500) {
          lastError = new Error(`API error ${res.status}: ${body}`);
          // Exponential back-off
          const delay = RETRY_BASE_MS * Math.pow(2, attempt);
          await sleep(delay, signal);
          continue;
        }
        // 4xx (except 429) = bad request, no point retrying
        throw new Error(`LLM API error ${res.status}: ${body}`);
      }

      const data = (await res.json()) as { output: string; error?: string };
      if (data.error) throw new Error(data.error);

      return {
        output: data.output,
        displayLabel:
          data.output.slice(0, 120) + (data.output.length > 120 ? "…" : ""),
      };
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      lastError = err as Error;
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        await sleep(delay, signal);
      }
    }
  }

  throw lastError;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("Cancelled"));
    });
  });
}

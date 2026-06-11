/**
 * src/lib/execution/handlers/index.ts
 *
 * Central registry of node handlers.
 * To add a new node type:
 *   1. Create myNodeHandler.ts
 *   2. Import it here
 *   3. Add it to HANDLERS
 * That's it — the engine picks it up automatically.
 */

import type { NodeKind } from "@/types/nodes";
import type { NodeHandler } from "../types";

import { textHandler } from "./textHandler";
import { imageHandler } from "./imageHandler";
import { videoHandler } from "./videoHandler";
import { llmHandler } from "./llmHandler";
import { cropHandler } from "./cropHandler";
import { extractHandler } from "./extractHandler";

export const HANDLERS: Record<NodeKind, NodeHandler> = {
  text: textHandler,
  image: imageHandler,
  video: videoHandler,
  llm: llmHandler,
  crop: cropHandler,
  extract: extractHandler,
};

/** Look up a handler — throws if the node type is not registered */
export function getHandler(kind: string): NodeHandler {
  const handler = HANDLERS[kind as NodeKind];
  if (!handler) {
    throw new Error(
      `No handler registered for node type "${kind}". ` +
        `Add one to src/lib/execution/handlers/index.ts.`,
    );
  }
  return handler;
}

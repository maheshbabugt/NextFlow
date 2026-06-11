/**
 * src/lib/execution/handlers/textHandler.ts
 *
 * Text node — simply returns its text content.
 * No async work needed; still async to match the NodeHandler signature.
 */

import type { NodeHandler } from "../types";
import type { TextNodeData } from "@/types/nodes";

export const textHandler: NodeHandler = async (nodeData) => {
  const d = nodeData as TextNodeData;
  const text = d.text?.trim() ?? "";

  return {
    output: text,
    displayLabel: text
      ? `"${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`
      : "(empty)",
  };
};

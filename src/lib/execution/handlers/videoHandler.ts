/**
 * src/lib/execution/handlers/videoHandler.ts
 *
 * Video node — passes videoUrl downstream.
 */

import type { NodeHandler } from "../types";
import type { VideoNodeData } from "@/types/nodes";

export const videoHandler: NodeHandler = async (nodeData) => {
  const d = nodeData as VideoNodeData;
  const url = d.videoUrl?.trim() ?? "";

  if (!url) {
    throw new Error("Video node: no URL provided.");
  }

  return {
    output: url,
    displayLabel: url,
  };
};

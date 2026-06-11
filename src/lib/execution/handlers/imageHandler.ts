/**
 * src/lib/execution/handlers/imageHandler.ts
 *
 * Image node — passes imageUrl downstream.
 * In production this would trigger a Transloadit upload and return the CDN URL.
 */

import type { NodeHandler } from "../types";
import type { ImageNodeData } from "@/types/nodes";

export const imageHandler: NodeHandler = async (nodeData) => {
  const d = nodeData as ImageNodeData;
  const url = d.imageUrl?.trim() ?? "";

  if (!url) {
    throw new Error("Image node: no URL provided. Paste a valid image URL.");
  }

  return {
    output: url,
    displayLabel: url,
  };
};

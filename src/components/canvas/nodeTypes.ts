/**
 * src/components/canvas/nodeTypes.ts
 *
 * Single source of truth for the nodeTypes prop passed to <ReactFlow>.
 * Import this object once in WorkflowCanvas — never recreate it inline.
 * (Recreating nodeTypes on every render breaks React Flow.)
 */

import TextNode from "./nodes/TextNode";
import ImageNode from "./nodes/ImageNode";
import VideoNode from "./nodes/VideoNode";
import LLMNode from "./nodes/LLMNode";
import CropNode from "./nodes/CropNode";
import ExtractNode from "./nodes/ExtractNode";

export const NODE_TYPES = {
  text: TextNode,
  image: ImageNode,
  video: VideoNode,
  llm: LLMNode,
  crop: CropNode,
  extract: ExtractNode,
} as const;

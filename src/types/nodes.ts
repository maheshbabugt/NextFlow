/**
 * src/types/nodes.ts
 * Central type definitions for the workflow canvas.
 */

import type { Node, Edge } from "@xyflow/react";

/* ─── Node kind identifiers ──────────────────────────────────────────── */

export type NodeKind = "text" | "image" | "video" | "llm" | "crop" | "extract";

/* ─── Execution status for each node ────────────────────────────────── */

export type NodeStatus = "idle" | "running" | "success" | "error" | "skipped";

/* ─── Output that an executed node produces ─────────────────────────── */

export interface NodeOutput {
  nodeId: string;
  value: string;
  timestamp: number;
}

/* ─── Per-node data shapes ───────────────────────────────────────────── */

export interface TextNodeData extends Record<string, unknown> {
  label: string;
  text: string;
  status?: NodeStatus;
  output?: string;
}

export interface ImageNodeData extends Record<string, unknown> {
  label: string;
  imageUrl: string;
  status?: NodeStatus;
  output?: string;
}

export interface VideoNodeData extends Record<string, unknown> {
  label: string;
  videoUrl: string;
  status?: NodeStatus;
  output?: string;
}

export interface LLMNodeData extends Record<string, unknown> {
  label: string;
  model: string;
  systemPrompt: string;
  userMessage: string;
  output: string;
  systemPromptConnected: boolean;
  userMessageConnected: boolean;
  imagesConnected: boolean;
  status?: NodeStatus;
}

export interface CropNodeData extends Record<string, unknown> {
  label: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrlConnected: boolean;
  status?: NodeStatus;
  output?: string;
}

export interface ExtractNodeData extends Record<string, unknown> {
  label: string;
  videoUrl: string;
  timestamp: string;
  outputImageUrl: string;
  videoUrlConnected: boolean;
  status?: NodeStatus;
  output?: string;
}

/* ─── Union types ────────────────────────────────────────────────────── */

export type AnyNodeData =
  | TextNodeData
  | ImageNodeData
  | VideoNodeData
  | LLMNodeData
  | CropNodeData
  | ExtractNodeData;

export type TextFlowNode = Node<TextNodeData, "text">;
export type ImageFlowNode = Node<ImageNodeData, "image">;
export type VideoFlowNode = Node<VideoNodeData, "video">;
export type LLMFlowNode = Node<LLMNodeData, "llm">;
export type CropFlowNode = Node<CropNodeData, "crop">;
export type ExtractFlowNode = Node<ExtractNodeData, "extract">;

export type AnyFlowNode =
  | TextFlowNode
  | ImageFlowNode
  | VideoFlowNode
  | LLMFlowNode
  | CropFlowNode
  | ExtractFlowNode;

/* ─── Connection type rules ──────────────────────────────────────────── */

export const CONNECTION_RULES: Record<NodeKind, string[]> = {
  text: ["system_prompt", "user_message", "timestamp"],
  image: ["images", "image_url"],
  video: ["video_url"],
  llm: ["user_message"],
  crop: ["images", "image_url"],
  extract: ["images"],
};

/* ─── History ────────────────────────────────────────────────────────── */

export interface HistorySnapshot {
  nodes: AnyFlowNode[];
  edges: Edge[];
}

/* ─── Execution scope ────────────────────────────────────────────────── */

export type ExecutionScope =
  | { type: "full" }
  | { type: "selected"; nodeIds: string[] }
  | { type: "single"; nodeId: string };

/* ─── Workflow store interface ───────────────────────────────────────── */

export interface WorkflowStore {
  // Graph
  nodes: AnyFlowNode[];
  edges: Edge[];
  setNodes: (nodes: AnyFlowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeData: (nodeId: string, data: Partial<AnyNodeData>) => void;
  addNode: (node: AnyFlowNode) => void;
  deleteNodes: (nodeIds: string[]) => void;

  // Execution
  nodeStatus: Record<string, NodeStatus>;
  nodeOutputs: Record<string, string>;
  nodeErrors: Record<string, string>;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  setNodeOutput: (nodeId: string, output: string) => void;
  setNodeError: (nodeId: string, error: string) => void;
  clearExecutionState: () => void;

  // History
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

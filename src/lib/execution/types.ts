/**
 * src/lib/execution/types.ts
 *
 * Types used exclusively by the execution engine.
 * Node-graph types live in src/types/nodes.ts — imported from there.
 */

import type { NodeStatus } from "@/types/nodes";

/* ─── Callbacks ──────────────────────────────────────────────────────── */

/** Called by the engine for every status/output transition */
export interface ExecutionCallbacks {
  onStatus: (nodeId: string, status: NodeStatus) => void;
  onOutput: (nodeId: string, output: string) => void;
  onError: (nodeId: string, error: string) => void;
}

/* ─── Inputs gathered for one node before it runs ───────────────────── */

/**
 * All inputs a node receives from upstream nodes.
 * Keyed by the target handle id (e.g. "user_message", "image_url").
 * The special key "images" is always an array (multiple image nodes can connect).
 */
export interface GatheredInputs {
  /** Single-value inputs keyed by handle id */
  byHandle: Record<string, string>;
  /** All image URLs collected from handles named "images" */
  images: string[];
}

/* ─── Result a handler returns ──────────────────────────────────────── */

export interface HandlerResult {
  /** The output value to pass downstream */
  output: string;
  /**
   * Optional extra outputs keyed by handle id.
   * For nodes with multiple output handles (future expansion).
   */
  extraOutputs?: Record<string, string>;
  /** Human-readable display label shown in the node output section */
  displayLabel?: string;
}

/* ─── Handler function signature ────────────────────────────────────── */

/** Every node handler must implement this shape */
export type NodeHandler = (
  /** The node's own data (cast to the right shape inside the handler) */
  nodeData: Record<string, unknown>,
  /** Inputs from upstream nodes */
  inputs: GatheredInputs,
  /** Optional: abort signal so long-running handlers can be cancelled */
  signal?: AbortSignal,
) => Promise<HandlerResult>;

/* ─── Execution context for one run ─────────────────────────────────── */

export interface ExecutionContext {
  /** Map: nodeId → output string from that node */
  outputs: Map<string, string>;
  /** Set of node IDs that failed — their dependents should be skipped */
  failed: Set<string>;
  /** Set of node IDs that were skipped */
  skipped: Set<string>;
}

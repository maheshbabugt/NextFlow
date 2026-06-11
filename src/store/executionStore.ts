/**
 * src/store/executionStore.ts
 *
 * Tracks live execution state for the current workflow run.
 *
 * WHY a separate store instead of writing into node data?
 * ────────────────────────────────────────────────────────
 * Node data (workflowStore) is the user's content — text they typed,
 * URLs they pasted. Execution state is transient — it should reset
 * every run and never be serialised to JSON or the DB.
 * Keeping them separate makes both cleaner.
 *
 * NodeShell reads from here using the node's id to decide what
 * visual state to show (glow, error border, success tick).
 */

import { create } from "zustand";

/* ─── Per-node status ────────────────────────────────────────────────── */

export type NodeStatus = "idle" | "running" | "success" | "error";

export interface NodeExecutionState {
  status: NodeStatus;
  /** Error message — only set when status === "error" */
  error?: string;
  /** Execution time in ms — set when status === "success" */
  durationMs?: number;
}

/* ─── Run-level status ───────────────────────────────────────────────── */

export type RunStatus = "idle" | "running" | "success" | "partial" | "error";

/* ─── Store interface ────────────────────────────────────────────────── */

interface ExecutionStore {
  /** Is a run currently in progress? */
  isRunning: boolean;

  /** Per-node execution states, keyed by nodeId */
  nodeStates: Record<string, NodeExecutionState>;

  /** Overall run result */
  runStatus: RunStatus;

  /** Human-readable error if the whole run failed to start */
  runError: string | null;

  /* ── Actions ── */

  /** Called once before execution starts — resets all state */
  startRun: () => void;

  /** Mark a single node as running */
  setNodeRunning: (nodeId: string) => void;

  /** Mark a single node as succeeded */
  setNodeSuccess: (nodeId: string, durationMs: number) => void;

  /** Mark a single node as errored */
  setNodeError: (nodeId: string, error: string) => void;

  /** Called when all nodes have finished */
  finishRun: (status: RunStatus) => void;

  /** Set a top-level run error (e.g. cycle detected) */
  setRunError: (error: string) => void;

  /** Reset everything back to idle (e.g. when canvas is cleared) */
  reset: () => void;
}

/* ─── Default state ──────────────────────────────────────────────────── */

const DEFAULT_STATE = {
  isRunning: false,
  nodeStates: {} as Record<string, NodeExecutionState>,
  runStatus: "idle" as RunStatus,
  runError: null,
};

/* ─── Store ──────────────────────────────────────────────────────────── */

export const useExecutionStore = create<ExecutionStore>((set) => ({
  ...DEFAULT_STATE,

  startRun: () =>
    set({
      isRunning: true,
      nodeStates: {},
      runStatus: "running",
      runError: null,
    }),

  setNodeRunning: (nodeId) =>
    set((s) => ({
      nodeStates: {
        ...s.nodeStates,
        [nodeId]: { status: "running" },
      },
    })),

  setNodeSuccess: (nodeId, durationMs) =>
    set((s) => ({
      nodeStates: {
        ...s.nodeStates,
        [nodeId]: { status: "success", durationMs },
      },
    })),

  setNodeError: (nodeId, error) =>
    set((s) => ({
      nodeStates: {
        ...s.nodeStates,
        [nodeId]: { status: "error", error },
      },
    })),

  finishRun: (status) => set({ isRunning: false, runStatus: status }),

  setRunError: (error) =>
    set({ isRunning: false, runStatus: "error", runError: error }),

  reset: () => set(DEFAULT_STATE),
}));

/* ─── Selector helpers (use these in components for perf) ──────────── */

/** Get the execution state for one node — returns idle default if not found */
export function selectNodeState(
  store: ExecutionStore,
  nodeId: string,
): NodeExecutionState {
  return store.nodeStates[nodeId] ?? { status: "idle" };
}

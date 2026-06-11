/**
 * src/store/workflowStore.ts
 *
 * Zustand store — single source of truth for the workflow editor.
 *
 * State groups:
 *  • Graph      — nodes, edges, CRUD operations
 *  • Execution  — nodeStatus, nodeOutputs, nodeErrors per node
 *  • History    — undo/redo stack (max 50 snapshots)
 */

import { create } from "zustand";
import type { Edge } from "@xyflow/react";
import type {
  AnyFlowNode,
  AnyNodeData,
  HistorySnapshot,
  NodeStatus,
  WorkflowStore,
} from "@/types/nodes";

const MAX_HISTORY = 50;

function snapshot(nodes: AnyFlowNode[], edges: Edge[]): HistorySnapshot {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
}

/* Extend WorkflowStore interface locally to add nodeErrors */
interface FullStore extends WorkflowStore {
  nodeErrors: Record<string, string>;
  setNodeError: (nodeId: string, error: string) => void;
}

export const useWorkflowStore = create<FullStore>((set, get) => ({
  /* ── Graph ─────────────────────────────────────────────────────── */
  nodes: [],
  edges: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  updateNodeData: (nodeId, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } as any } : n,
      ),
    })),

  addNode: (node) => {
    get().pushHistory();
    set((s) => ({ nodes: [...s.nodes, node] }));
  },

  deleteNodes: (nodeIds) => {
    const ids = new Set(nodeIds);
    get().pushHistory();
    set((s) => ({
      nodes: s.nodes.filter((n) => !ids.has(n.id)),
      edges: s.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
      nodeStatus: Object.fromEntries(
        Object.entries(s.nodeStatus).filter(([id]) => !ids.has(id)),
      ),
      nodeOutputs: Object.fromEntries(
        Object.entries(s.nodeOutputs).filter(([id]) => !ids.has(id)),
      ),
      nodeErrors: Object.fromEntries(
        Object.entries(s.nodeErrors).filter(([id]) => !ids.has(id)),
      ),
    }));
  },

  /* ── Execution ─────────────────────────────────────────────────── */
  nodeStatus: {},
  nodeOutputs: {},
  nodeErrors: {},

  setNodeStatus: (nodeId, status) =>
    set((s) => ({ nodeStatus: { ...s.nodeStatus, [nodeId]: status } })),

  setNodeOutput: (nodeId, output) =>
    set((s) => ({ nodeOutputs: { ...s.nodeOutputs, [nodeId]: output } })),

  setNodeError: (nodeId, error) =>
    set((s) => ({ nodeErrors: { ...s.nodeErrors, [nodeId]: error } })),

  clearExecutionState: () =>
    set({ nodeStatus: {}, nodeOutputs: {}, nodeErrors: {} }),

  /* ── History ───────────────────────────────────────────────────── */
  past: [],
  future: [],

  pushHistory: () => {
    const { nodes, edges, past } = get();
    set({
      past: [...past, snapshot(nodes, edges)].slice(-MAX_HISTORY),
      future: [],
    });
  },

  undo: () => {
    const { nodes, edges, past, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      past: past.slice(0, -1),
      future: [snapshot(nodes, edges), ...future].slice(0, MAX_HISTORY),
      nodeStatus: {},
      nodeOutputs: {},
      nodeErrors: {},
    });
  },

  redo: () => {
    const { nodes, edges, past, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, snapshot(nodes, edges)].slice(-MAX_HISTORY),
      future: future.slice(1),
      nodeStatus: {},
      nodeOutputs: {},
      nodeErrors: {},
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));

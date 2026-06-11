/**
 * src/lib/graphUtils.ts
 *
 * Pure utility functions for graph validation.
 * No React, no side-effects — easy to unit-test.
 */

import type { Edge } from "@xyflow/react";
import type { AnyFlowNode, NodeKind } from "@/types/nodes";
import { CONNECTION_RULES } from "@/types/nodes";

/* ─── DAG cycle detection ────────────────────────────────────────────── */

/**
 * Returns true if adding the edge (source → target) would create a cycle.
 * Uses DFS from the proposed target; if it can reach the proposed source,
 * the edge would form a cycle.
 */
export function wouldCreateCycle(
  edges: Edge[],
  proposedSource: string,
  proposedTarget: string,
): boolean {
  // Build adjacency list from existing edges + the proposed one
  const adj = new Map<string, string[]>();
  const addEdge = (s: string, t: string) => {
    if (!adj.has(s)) adj.set(s, []);
    adj.get(s)!.push(t);
  };
  for (const e of edges) addEdge(e.source, e.target);
  addEdge(proposedSource, proposedTarget);

  // DFS from proposedSource — can we reach proposedSource again?
  const visited = new Set<string>();
  const stack = [proposedTarget];
  while (stack.length) {
    const node = stack.pop()!;
    if (node === proposedSource) return true; // cycle!
    if (visited.has(node)) continue;
    visited.add(node);
    for (const next of adj.get(node) ?? []) stack.push(next);
  }
  return false;
}

/* ─── Type-safe connection validation ───────────────────────────────── */

/**
 * Returns true if the connection is semantically valid.
 *
 * Rules (from CONNECTION_RULES in types/nodes.ts):
 *   - Check that the SOURCE node's kind is allowed to connect
 *     to the TARGET handle id.
 */
export function isValidConnection(
  sourceKind: NodeKind | undefined,
  targetHandleId: string | null | undefined,
): boolean {
  if (!sourceKind || !targetHandleId) return false;
  const allowed = CONNECTION_RULES[sourceKind];
  return allowed.includes(targetHandleId);
}

/* ─── Topological sort (for ordered execution) ───────────────────────── */

/**
 * Returns nodes in topological order (roots first).
 * Assumes the graph is a DAG (enforced by wouldCreateCycle).
 */
export function topologicalSort(
  nodes: AnyFlowNode[],
  edges: Edge[],
): AnyFlowNode[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  const queue = nodes.filter((n) => inDegree.get(n.id) === 0);
  const result: AnyFlowNode[] = [];

  while (queue.length) {
    const node = queue.shift()!;
    result.push(node);
    for (const neighbour of adj.get(node.id) ?? []) {
      const deg = (inDegree.get(neighbour) ?? 1) - 1;
      inDegree.set(neighbour, deg);
      if (deg === 0) {
        const n = nodes.find((x) => x.id === neighbour);
        if (n) queue.push(n);
      }
    }
  }

  return result;
}

/* ─── Get source node kind for a given edge ──────────────────────────── */

export function getSourceKind(
  nodes: AnyFlowNode[],
  sourceId: string,
): NodeKind | undefined {
  const node = nodes.find((n) => n.id === sourceId);
  return node?.type as NodeKind | undefined;
}

/* ─── Plain topo sort (no React Flow import, safe for server) ─────────── */

export function topologicalSortPlain(
  nodes: { id: string }[],
  edges: { source: string; target: string }[],
): { id: string }[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  const queue = nodes.filter((n) => inDegree.get(n.id) === 0);
  const result: { id: string }[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    result.push(node);
    for (const nb of adj.get(node.id) ?? []) {
      const deg = (inDegree.get(nb) ?? 1) - 1;
      inDegree.set(nb, deg);
      if (deg === 0) {
        const n = nodes.find((x) => x.id === nb);
        if (n) queue.push(n);
      }
    }
  }
  return result;
}

/* ─── Build waves (server-side, no React imports) ─────────────────────── */

export function buildWaves<T extends { id: string }>(
  sorted: T[],
  edges: { source: string; target: string }[],
): T[][] {
  const waveOf = new Map<string, number>();
  for (const node of sorted) {
    const incoming = edges.filter((e) => e.target === node.id);
    waveOf.set(
      node.id,
      incoming.length === 0
        ? 0
        : Math.max(...incoming.map((e) => waveOf.get(e.source) ?? 0)) + 1,
    );
  }
  const maxWave = waveOf.size ? Math.max(...waveOf.values()) : 0;
  const waves: T[][] = Array.from({ length: maxWave + 1 }, () => []);
  for (const node of sorted) waves[waveOf.get(node.id) ?? 0].push(node);
  return waves.filter((w) => w.length > 0);
}

/* ─── Collect upstream deps (server-safe) ─────────────────────────────── */

export function collectUpstreamDeps(
  targetIds: Set<string>,
  edges: { source: string; target: string }[],
): Set<string> {
  const result = new Set(targetIds);
  const queue = [...targetIds];
  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.target === current && !result.has(edge.source)) {
        result.add(edge.source);
        queue.push(edge.source);
      }
    }
  }
  return result;
}

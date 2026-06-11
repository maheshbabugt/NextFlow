/**
 * src/lib/execution/engine.ts
 *
 * The core execution engine. Responsibilities:
 *
 *  1. resolveScope    — determine which nodes to run (full / selected / single)
 *  2. buildWaves      — group topo-sorted nodes into parallel execution waves
 *  3. runWave         — execute one wave with Promise.all (true parallelism)
 *  4. runSingleNode   — gather inputs, call handler, broadcast status/output
 *  5. Error isolation — if node A fails, its dependents are SKIPPED (not crashed)
 *
 * ── Wave-based parallel execution ─────────────────────────────────────
 *
 *  Wave 0: root nodes (no incoming edges) → all run concurrently
 *  Wave N: nodes whose ALL dependencies finished in waves 0..N-1
 *
 *  Example — the PDF's Product Marketing Kit workflow:
 *    Wave 0 │ Upload Image │ Upload Video │ Text (system) │ Text (details)
 *    Wave 1 │ Crop Image   │ Extract Frame
 *    Wave 2 │ LLM Node #1  (waits for Crop + both Texts)
 *    Wave 3 │ LLM Node #2  (waits for LLM #1 + Extract)
 *
 * ── Error propagation ─────────────────────────────────────────────────
 *
 *  If a node fails:
 *  • Its own status → "error"
 *  • Its ID is added to ctx.failed
 *  • Any node in a later wave that depends on it → status "skipped"
 *  • Sibling nodes in the SAME wave are NOT affected (they continue)
 */

import type { Edge } from "@xyflow/react";
import type { AnyFlowNode, ExecutionScope, NodeStatus } from "@/types/nodes";
import { topologicalSort } from "../graphUtils";
import { gatherInputs, hasFailedDependency } from "./inputGather";
import { getHandler } from "./handlers/index";
import type { ExecutionCallbacks, ExecutionContext } from "./types";

/* ==== Public: run a scoped workflow ==== */

export async function runWorkflow(
  allNodes: AnyFlowNode[],
  allEdges: Edge[],
  scope: ExecutionScope,
  callbacks: ExecutionCallbacks,
  signal?: AbortSignal,
  /** Pre-existing outputs from the store (e.g. from previous runs or uploads).
   *  These seed ctx.outputs so "Run node" on a downstream node can read
   *  upstream outputs that were already produced without re-running them. */
  existingOutputs?: Map<string, string>,
): Promise<Map<string, string>> {
  // 1. Choose which nodes to run
  const nodesToRun = resolveScope(allNodes, allEdges, scope);
  if (nodesToRun.length === 0) return new Map();

  // 2. Restrict edges to the subgraph we're running
  const runIds = new Set(nodesToRun.map((n) => n.id));
  const subEdges = allEdges.filter(
    (e) => runIds.has(e.source) && runIds.has(e.target),
  );

  // 3. Topological sort then group into parallel waves
  const sorted = topologicalSort(nodesToRun, subEdges);
  const waves = buildWaves(sorted, subEdges);

  // 4. Shared execution context — seed with existing outputs so upstream
  //    nodes that already ran (or uploaded) don't need to re-execute.
  const ctx: ExecutionContext = {
    outputs: existingOutputs ? new Map(existingOutputs) : new Map(),
    failed: new Set(),
    skipped: new Set(),
  };

  // 5. Run wave by wave
  for (const wave of waves) {
    if (signal?.aborted) break;
    await runWave(wave, allEdges, ctx, callbacks, signal);
  }

  return ctx.outputs;
}

/* ==== Scope resolver ==== */

function resolveScope(
  allNodes: AnyFlowNode[],
  allEdges: Edge[],
  scope: ExecutionScope,
): AnyFlowNode[] {
  if (scope.type === "full") return allNodes;

  if (scope.type === "single") {
    return allNodes.filter((n) => n.id === scope.nodeId);
  }

  // "selected" → include selected nodes + all upstream dependencies
  const targetIds = new Set(scope.nodeIds);
  const requiredIds = collectUpstreamDeps(targetIds, allEdges);
  return allNodes.filter((n) => requiredIds.has(n.id));
}

function collectUpstreamDeps(
  targetIds: Set<string>,
  edges: Edge[],
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

/* ==== Wave builder ==== */

function buildWaves(sorted: AnyFlowNode[], edges: Edge[]): AnyFlowNode[][] {
  const waveOf = new Map<string, number>();

  for (const node of sorted) {
    const incoming = edges.filter((e) => e.target === node.id);
    if (incoming.length === 0) {
      waveOf.set(node.id, 0);
    } else {
      const maxDep = Math.max(
        ...incoming.map((e) => waveOf.get(e.source) ?? 0),
      );
      waveOf.set(node.id, maxDep + 1);
    }
  }

  const maxWave = waveOf.size ? Math.max(...waveOf.values()) : 0;
  const waves: AnyFlowNode[][] = Array.from({ length: maxWave + 1 }, () => []);
  for (const node of sorted) {
    waves[waveOf.get(node.id) ?? 0].push(node);
  }
  return waves.filter((w) => w.length > 0);
}

/* ==== Wave executor (PARALLEL EXECUTION) ==== */

// Minimum time a node stays in "running" state so the glow is visible.
// Fast nodes (text/image/video) complete in microseconds — without this
// the animation flashes too briefly to see.
const MIN_GLOW_MS = 600;

async function runWave(
  wave: AnyFlowNode[],
  allEdges: Edge[],
  ctx: ExecutionContext,
  callbacks: ExecutionCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  // 1. Mark ALL nodes in this wave as "running" synchronously first
  //    so the pulsating glow starts for the entire wave at once.
  for (const node of wave) {
    if (!hasFailedDependency(node.id, allEdges, ctx) && !signal?.aborted) {
      callbacks.onStatus(node.id, "running");
    }
  }

  // 2. Execute all nodes concurrently, each with a minimum glow duration
  await Promise.all(
    wave.map((node) => runSingleNode(node, allEdges, ctx, callbacks, signal)),
  );
}

/* ==== Single node executor ==== */

async function runSingleNode(
  node: AnyFlowNode,
  allEdges: Edge[],
  ctx: ExecutionContext,
  { onStatus, onOutput, onError }: ExecutionCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  if (hasFailedDependency(node.id, allEdges, ctx)) {
    ctx.skipped.add(node.id);
    onStatus(node.id, "skipped" as NodeStatus);
    return;
  }

  if (signal?.aborted) {
    ctx.skipped.add(node.id);
    onStatus(node.id, "skipped" as NodeStatus);
    return;
  }

  // "running" was already emitted by runWave — don't repeat it.
  // Track start time to enforce minimum glow duration.
  const startedAt = Date.now();

  try {
    const handler = getHandler(node.type ?? "");
    const inputs = gatherInputs(node.id, allEdges, ctx);
    const result = await handler(
      node.data as Record<string, unknown>,
      inputs,
      signal,
    );

    // Ensure the glow is visible for at least MIN_GLOW_MS
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_GLOW_MS && !signal?.aborted) {
      await new Promise<void>((r) => setTimeout(r, MIN_GLOW_MS - elapsed));
    }

    ctx.outputs.set(node.id, result.output);
    onOutput(node.id, result.output);
    onStatus(node.id, "success");
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_GLOW_MS && !signal?.aborted) {
      await new Promise<void>((r) => setTimeout(r, MIN_GLOW_MS - elapsed));
    }
    const message = err instanceof Error ? err.message : String(err);
    ctx.failed.add(node.id);
    onError(node.id, message);
    onStatus(node.id, "error");
  }
}

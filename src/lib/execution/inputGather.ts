/**
 * src/lib/execution/inputGatherer.ts
 *
 * Given a node and the current execution context, collect all inputs
 * that upstream nodes have produced and organise them by handle id.
 *
 * This is the ONLY place that reads from ExecutionContext.outputs.
 * Keeping it isolated makes the engine easy to test and reason about.
 */

import type { Edge } from "@xyflow/react";
import type { ExecutionContext, GatheredInputs } from "./types";

/**
 * Build GatheredInputs for one node by inspecting its incoming edges
 * and reading each source node's output from the context.
 *
 * @param nodeId      The node being executed
 * @param allEdges    The full edge list (we filter to incoming only)
 * @param ctx         Current execution context (holds outputs map)
 */
export function gatherInputs(
  nodeId: string,
  allEdges: Edge[],
  ctx: ExecutionContext,
): GatheredInputs {
  const result: GatheredInputs = { byHandle: {}, images: [] };

  // Find every edge that points into this node
  const incoming = allEdges.filter((e) => e.target === nodeId);

  for (const edge of incoming) {
    const value = ctx.outputs.get(edge.source);
    // If the upstream node didn't produce output (failed / not run), skip
    if (value === undefined) continue;

    const handle = edge.targetHandle;

    // Edges without an explicit targetHandle are stored under "" so handlers
    // can still access them as a fallback, but named handles take priority.
    if (handle === "images") {
      // Multiple image nodes can connect to a single LLM "images" handle
      result.images.push(value);
    } else if (handle) {
      // Named handle — store by handle id (last-write wins per handle)
      result.byHandle[handle] = value;
    } else {
      // No targetHandle on this edge — store under "" as a last-resort fallback
      result.byHandle[""] = value;
    }
  }

  return result;
}

/**
 * Returns true if any direct upstream dependency of this node failed.
 * If so, the node should be skipped rather than run with incomplete inputs.
 */
export function hasFailedDependency(
  nodeId: string,
  allEdges: Edge[],
  ctx: ExecutionContext,
): boolean {
  const incoming = allEdges.filter((e) => e.target === nodeId);
  return incoming.some((e) => ctx.failed.has(e.source));
}

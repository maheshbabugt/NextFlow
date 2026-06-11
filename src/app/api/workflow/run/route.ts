/**
 * src/app/api/workflow/run/route.ts
 *
 * POST /api/workflow/run
 *
 * Triggers the orchestrator task and immediately returns the runId.
 * The frontend polls /api/workflow/status?runId=... for completion.
 */

import { NextRequest, NextResponse } from "next/server";
import type { AnyFlowNode, ExecutionScope } from "@/types/nodes";
import type { Edge } from "@xyflow/react";
import { orchestratorTask } from "@/trigger/orchestratorTask";
import type { OrchestratorPayload } from "@/trigger/orchestratorTask";

export async function POST(req: NextRequest) {
  let body: {
    nodes: AnyFlowNode[];
    edges: Edge[];
    scope: ExecutionScope;
    existingOutputs?: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { nodes, edges, scope, existingOutputs } = body;
  const payload: OrchestratorPayload = { nodes, edges, scope, existingOutputs };

  const handle = await orchestratorTask.trigger(payload);

  return NextResponse.json({ runId: handle.id });
}

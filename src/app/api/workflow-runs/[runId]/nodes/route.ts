/**
 * src/app/api/workflow-runs/[runId]/nodes/route.ts
 *
 * POST /api/workflow-runs/[runId]/nodes — create/update node run
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { validateBody } from "@/lib/validate";

const NodeRunSchema = z.object({
  nodeId:    z.string().min(1),
  nodeType:  z.string().min(1),
  nodeLabel: z.string().min(1),
  status:    z.enum(["pending", "running", "success", "error", "failed", "skipped"]).optional(),
  inputs:    z.unknown().optional(),
  output:    z.unknown().optional(),
  error:     z.string().optional(),
  durationMs: z.number().int().nonnegative().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { runId } = await params;

  const { data, error } = await validateBody(req, NodeRunSchema);
  if (error) return error;

  const { nodeId, nodeType, nodeLabel, status, inputs, output, error: nodeError, durationMs } = data;

  const run = await prisma.workflowRun.findFirst({ where: { id: runId, userId } });
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const existing = await prisma.nodeRun.findFirst({
    where: { workflowRunId: runId, nodeId },
  });

  const isTerminal = status && status !== "running" && status !== "pending";

  let nodeRun;
  if (existing) {
    nodeRun = await prisma.nodeRun.update({
      where: { id: existing.id },
      data: {
        status:     status     ?? existing.status,
        inputs:     inputs     !== undefined ? (inputs as Prisma.InputJsonValue) : existing.inputs ?? Prisma.JsonNull,
        output:     output     !== undefined ? (output as Prisma.InputJsonValue) : existing.output ?? Prisma.JsonNull,
        error:      nodeError  ?? existing.error,
        durationMs: durationMs ?? existing.durationMs,
        startedAt:  status === "running" && !existing.startedAt ? new Date() : existing.startedAt,
        completedAt: isTerminal ? new Date() : undefined,
      },
    });
  } else {
    nodeRun = await prisma.nodeRun.create({
      data: {
        workflowRunId: runId,
        nodeId,
        nodeType,
        nodeLabel,
        status:     status     ?? "pending",
        inputs:     inputs     ?? Prisma.JsonNull,
        output:     output     ?? Prisma.JsonNull,
        error:      nodeError  ?? null,
        durationMs: durationMs ?? null,
        startedAt:  status === "running" ? new Date() : null,
        completedAt: isTerminal ? new Date() : null,
      },
    });
  }

  return NextResponse.json({ nodeRun });
}

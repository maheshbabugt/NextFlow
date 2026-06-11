/**
 * src/app/api/workflow-runs/[runId]/route.ts
 *
 * PATCH /api/workflow-runs/[runId] — update run status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateBody } from "@/lib/validate";

const PatchRunSchema = z.object({
  status: z.enum(["running", "success", "error", "failed", "partial", "cancelled"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { runId } = await params;

  const { data, error } = await validateBody(req, PatchRunSchema);
  if (error) return error;

  const { status } = data;

  const run = await prisma.workflowRun.findFirst({ where: { id: runId, userId } });
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const completedAt = status && status !== "running" ? new Date() : undefined;
  const duration = completedAt
    ? (completedAt.getTime() - run.startedAt.getTime()) / 1000
    : undefined;

  const updated = await prisma.workflowRun.update({
    where: { id: runId },
    data: {
      status:      status ?? run.status,
      completedAt: completedAt ?? undefined,
      duration:    duration ?? undefined,
    },
    include: { nodeRuns: true },
  });

  return NextResponse.json({ run: updated });
}

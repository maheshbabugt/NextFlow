/**
 * src/app/api/workflow-runs/route.ts
 *
 * GET  /api/workflow-runs        — fetch all runs for current user
 * POST /api/workflow-runs        — create a new workflow run
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/* ─── GET — list user's workflow runs ───────────────────────────────── */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get("workflowId");

  const where = workflowId ? { userId, workflowId } : { userId };

  const runs = await prisma.workflowRun.findMany({
    where,
    orderBy: { startedAt: "desc" },
    include: {
      nodeRuns: {
        orderBy: { startedAt: "asc" },
      },
    },
    take: 50,
  });

  return NextResponse.json({ runs });
}

/* ─── POST — create a new workflow run ──────────────────────────────── */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { workflowId?: string; scope?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workflowId, scope = "full" } = body;

  const run = await prisma.workflowRun.create({
    data: {
      userId,
      workflowId: workflowId ?? null,
      status: "running",
      scope,
    },
  });

  return NextResponse.json({ run }, { status: 201 });
}

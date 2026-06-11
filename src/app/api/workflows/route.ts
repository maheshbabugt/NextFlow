/**
 * src/app/api/workflows/route.ts
 *
 * GET    /api/workflows       — fetch all workflows for the current user
 * POST   /api/workflows       — save (create or update) a workflow
 * DELETE /api/workflows?id=   — delete a workflow
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateBody } from "@/lib/validate";

const WorkflowBodySchema = z.object({
  id:    z.string().optional(),
  name:  z.string().max(255).optional(),
  nodes: z.unknown().optional(),
  edges: z.unknown().optional(),
});

/* ─── GET ────────────────────────────────────────────────────────────── */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, nodes: true, edges: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ workflows });
}

/* ─── POST ───────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await validateBody(req, WorkflowBodySchema);
  if (error) return error;

  const { id, name, nodes, edges } = data;

  if (id) {
    const existing = await prisma.workflow.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        ...(nodes != null && { nodes }),
        ...(edges != null && { edges }),
      },
    });
    return NextResponse.json({ workflow: updated });
  }

  if (!nodes || !edges) {
    return NextResponse.json({ error: "nodes and edges are required" }, { status: 400 });
  }

  const workflow = await prisma.workflow.create({
    data: { userId, name: name ?? "Untitled", nodes, edges },
  });

  return NextResponse.json({ workflow }, { status: 201 });
}

/* ─── DELETE ─────────────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

  await prisma.workflow.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

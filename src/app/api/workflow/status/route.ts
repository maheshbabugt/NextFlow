/**
 * src/app/api/workflow/status/route.ts
 *
 * GET /api/workflow/status?runId=...
 *
 * Returns the current status and output of a workflow orchestrator run.
 * Frontend polls this until status is COMPLETED, FAILED, or CRASHED.
 */

import { NextRequest, NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import type { OrchestratorResult } from "@/trigger/orchestratorTask";

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  const run = await runs.retrieve(runId);

  const terminal = ["COMPLETED", "FAILED", "CRASHED", "CANCELED", "SYSTEM_FAILURE", "INTERRUPTED"];
  const done = terminal.includes(run.status);

  return NextResponse.json({
    status: run.status,
    done,
    output: done && run.status === "COMPLETED"
      ? (run.output as OrchestratorResult)
      : null,
    error: done && run.status !== "COMPLETED"
      ? `Task ${run.status.toLowerCase()}`
      : null,
  });
}

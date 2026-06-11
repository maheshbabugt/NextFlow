/**
 * src/app/api/workflow/stream/route.ts
 *
 * GET /api/workflow/stream?runId=...
 *
 * Server-Sent Events endpoint that streams workflow execution events in real-time.
 * Polls the Trigger.dev task status and streams events as they become available.
 */

import { NextRequest, NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import type { OrchestratorResult } from "@/trigger/orchestratorTask";

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastEventIndex = 0;
      let pollAttempts = 0;
      const MAX_ATTEMPTS = 240; // 6 minutes

      try {
        while (pollAttempts < MAX_ATTEMPTS) {
          pollAttempts++;

          try {
            const run = await runs.retrieve(runId);
            const terminal = ["COMPLETED", "FAILED", "CRASHED", "CANCELED", "SYSTEM_FAILURE", "INTERRUPTED"];
            const done = terminal.includes(run.status);

            if (done && run.status === "COMPLETED" && run.output) {
              const result = run.output as OrchestratorResult;
              const events = result.events || [];

              // Stream any new events since last poll
              for (let i = lastEventIndex; i < events.length; i++) {
                const event = events[i];
                const data = `data: ${JSON.stringify(event)}\n\n`;
                controller.enqueue(encoder.encode(data));
              }

              lastEventIndex = events.length;

              // Send done event and close
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "stream_done" })}\n\n`));
              controller.close();
              return;
            } else if (done && run.status !== "COMPLETED") {
              // Task failed
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "stream_error", error: `Task ${run.status.toLowerCase()}` })}\n\n`
                )
              );
              controller.close();
              return;
            }

            // Task still running - stream any new events
            if (run.output) {
              const result = run.output as OrchestratorResult;
              const events = result.events || [];

              for (let i = lastEventIndex; i < events.length; i++) {
                const event = events[i];
                const data = `data: ${JSON.stringify(event)}\n\n`;
                controller.enqueue(encoder.encode(data));
              }

              lastEventIndex = events.length;
            }
          } catch (err) {
            console.error("[stream] Error retrieving run:", err);
          }

          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, 500)); // Poll every 500ms for real-time feel
        }

        // Timeout
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "stream_error", error: "Workflow timed out" })}\n\n`)
        );
        controller.close();
      } catch (err) {
        console.error("[stream] Stream error:", err);
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

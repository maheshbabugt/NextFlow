/**
 * src/hooks/useWorkflowRunPersistence.ts
 *
 * Hook to persist workflow runs to database while maintaining
 * real-time UI updates via Zustand.
 */

import { useCallback, useRef } from "react";
import { useHistoryStore } from "@/lib/historyStore";
import type { NodeRunStatus, RunStatus } from "@/lib/historyStore";

export function useWorkflowRunPersistence() {
  const { markSynced } = useHistoryStore();
  const dbRunIdRef = useRef<string | null>(null);

  /**
   * Create a workflow run in the database
   */
  const createRun = useCallback(async (workflowId?: string, scope: string = "full") => {
    try {
      const res = await fetch("/api/workflow-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: workflowId ?? null, scope }),
      });

      if (!res.ok) throw new Error("Failed to create run");
      const { run } = await res.json();
      dbRunIdRef.current = run.id;
      return run.id;
    } catch (err) {
      console.error("Failed to create workflow run:", err);
      return null;
    }
  }, []);

  /**
   * Update a node run in the database
   */
  const updateNodeRun = useCallback(
    async (
      nodeId: string,
      nodeType: string,
      nodeLabel: string,
      patch: {
        status?: NodeRunStatus;
        inputs?: unknown;
        output?: unknown;
        error?: string;
        durationMs?: number;
      }
    ) => {
      if (!dbRunIdRef.current) return;

      try {
        await fetch(`/api/workflow-runs/${dbRunIdRef.current}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId,
            nodeType,
            nodeLabel,
            ...patch,
          }),
        });
      } catch (err) {
        console.error("Failed to update node run:", err);
      }
    },
    []
  );

  /**
   * Finish a workflow run in the database
   */
  const finishRun = useCallback(async (status: RunStatus) => {
    if (!dbRunIdRef.current) return;

    try {
      await fetch(`/api/workflow-runs/${dbRunIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("Failed to finish workflow run:", err);
    }
  }, []);

  /**
   * Load historical runs from database
   */
  const loadHistoricalRuns = useCallback(async (workflowId?: string) => {
    try {
      const url = new URL("/api/workflow-runs", window.location.origin);
      if (workflowId) url.searchParams.set("workflowId", workflowId);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch runs");

      const { runs } = await res.json();
      useHistoryStore.getState().loadFromDB(runs);
    } catch (err) {
      console.error("Failed to load historical runs:", err);
    }
  }, []);

  return {
    createRun,
    updateNodeRun,
    finishRun,
    loadHistoricalRuns,
  };
}

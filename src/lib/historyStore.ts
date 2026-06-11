import { create } from "zustand";

/* ─── Types ──────────────────────────────────────────────────────────── */

export type NodeRunStatus = "pending" | "running" | "success" | "failed" | "skipped";
export type RunStatus     = "running" | "success" | "failed" | "partial" | "cancelled";
export type RunScope      = "full" | "partial" | "single";  // Maps to ExecutionScope: full, selected (→partial), single node

export interface NodeRunRecord {
  id:         string;
  type:       string;
  label:      string;
  status:     NodeRunStatus;
  inputs?:    Record<string, unknown>;  // inputs used by this node
  output?:    string;
  error?:     string;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number | null;
}

export interface WorkflowRun {
  runId:      string;
  dbId?:      string;
  scope:      RunScope;
  startedAt:  number;
  finishedAt?: number;
  status:     RunStatus;
  nodes:      NodeRunRecord[];
  synced?:    boolean;
}

interface HistoryStore {
  runs: WorkflowRun[];
  startRun:        (runId: string, nodes: Pick<NodeRunRecord, "id" | "type" | "label">[], scope: RunScope, dbId?: string) => void;
  updateNodeInRun: (runId: string, nodeId: string, patch: Partial<NodeRunRecord>) => void;
  finishRun:       (runId: string, status: RunStatus) => void;
  markSynced:      (runId: string) => void;
  clearHistory:    () => void;
  loadFromDB:      (runs: any[]) => void;
}

/* ─── Utilities ──────────────────────────────────────────────────────── */

/**
 * Compute the overall run status from node statuses.
 * - Any still running → "running"
 * - All success       → "success"
 * - All failed/skip   → "failed"
 * - Mix of success + failed → "partial"
 */
export function calculateRunStatus(nodes: NodeRunRecord[]): RunStatus {
  const statuses = nodes.map((n) => n.status);
  if (statuses.some((s) => s === "running" || s === "pending")) return "running";
  const succeeded = statuses.filter((s) => s === "success").length;
  const failed    = statuses.filter((s) => s === "failed").length;
  if (failed === 0)    return "success";
  if (succeeded === 0) return "failed";
  return "partial";
}

/** Format node duration: 1200 → "1,200ms" */
export function formatNodeDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  return `${ms.toLocaleString()}ms`;
}

/** Format run duration: 5300ms → "5.3s" */
export function formatRunDuration(startedAt: number, finishedAt?: number): string {
  if (!finishedAt) return "…";
  return ((finishedAt - startedAt) / 1000).toFixed(1) + "s";
}

/** Format timestamp: Jan 14, 2026 3:45 PM */
export function formatRunTimestamp(ts: number): string {
  return new Date(ts).toLocaleString([], {
    month: "short",
    day:   "numeric",
    year:  "numeric",
    hour:  "2-digit",
    minute: "2-digit",
  });
}

/** Scope display label */
export function getScopeLabel(scope: RunScope): string {
  if (scope === "full")    return "Full";
  if (scope === "partial") return "Partial";
  return "Single";
}

/* ─── Store ──────────────────────────────────────────────────────────── */

export const useHistoryStore = create<HistoryStore>((set) => ({
  runs: [],

  startRun: (runId, nodeList, scope, dbId) => {
    const newRun: WorkflowRun = {
      runId,
      dbId,
      scope,
      startedAt: Date.now(),
      status: "running",
      nodes: nodeList.map((n) => ({ ...n, status: "pending" })),
      synced: !!dbId,
    };
    set((s) => ({ runs: [newRun, ...s.runs].slice(0, 50) }));
  },

  updateNodeInRun: (runId, nodeId, patch) =>
    set((s) => ({
      runs: s.runs.map((run) => {
        if (run.runId !== runId) return run;
        const nodes = run.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n));
        return { ...run, nodes };
      }),
    })),

  finishRun: (runId, explicitStatus) =>
    set((s) => ({
      runs: s.runs.map((run) => {
        if (run.runId !== runId) return run;
        // Compute status from node results unless explicitly cancelled
        const status =
          explicitStatus === "cancelled"
            ? "cancelled"
            : calculateRunStatus(run.nodes);
        return { ...run, status, finishedAt: Date.now() };
      }),
    })),

  markSynced: (runId) =>
    set((s) => ({
      runs: s.runs.map((run) =>
        run.runId !== runId ? run : { ...run, synced: true },
      ),
    })),

  clearHistory: () => set({ runs: [] }),

  loadFromDB: (dbRuns) => {
    const converted: WorkflowRun[] = dbRuns.map((run: any) => ({
      runId:      `db-${run.id}`,
      dbId:       run.id,
      scope:      (run.scope as RunScope) ?? "full",
      startedAt:  new Date(run.startedAt).getTime(),
      finishedAt: run.completedAt ? new Date(run.completedAt).getTime() : undefined,
      status:     run.status as RunStatus,
      nodes: (run.nodeRuns || []).map((nr: any) => ({
        id:         nr.nodeId,
        type:       nr.nodeType,
        label:      nr.nodeLabel,
        status:     nr.status as NodeRunStatus,
        inputs:     nr.inputs ?? undefined,
        output:     nr.output ? JSON.stringify(nr.output) : undefined,
        error:      nr.error,
        startedAt:  nr.startedAt  ? new Date(nr.startedAt).getTime()  : undefined,
        finishedAt: nr.completedAt ? new Date(nr.completedAt).getTime() : undefined,
        durationMs: nr.durationMs,
      })),
      synced: true,
    }));
    set((s) => ({ runs: [...converted, ...s.runs].slice(0, 50) }));
  },
}));

export function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

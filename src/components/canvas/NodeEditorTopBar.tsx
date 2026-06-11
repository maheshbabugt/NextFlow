/**
 * src/components/canvas/NodeEditorTopBar.tsx
 *
 * Changes from previous version:
 *  + History button (clock icon) → toggles HistorySidebar
 *  + execute() now calls historyStore.startRun() before running
 *    and updateNodeInRun() / finishRun() as nodes complete
 *  + Workflow runs are persisted to database via useWorkflowRunPersistence
 *  + Reads workflow ID from URL params and loads workflow data
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Square,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Save,
  MousePointerClick,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Sparkles,
  History,
} from "lucide-react";
import { useWorkflowStore } from "@/store/workflowStore";
import { useHistoryStore, generateRunId } from "@/lib/historyStore";
import { useWorkflowRunPersistence } from "@/hooks/useWorkflowRunPersistence";
import { runWorkflow } from "@/lib/execution";
import { buildSampleWorkflow } from "@/lib/sampleWorkflow";
import HistorySidebar from "./HistorySidebar";
import type { ExecutionScope, NodeStatus } from "@/types/nodes";

type RunResult = "success" | "error" | null;

export default function NodeEditorTopBar() {
  const params = useParams();
  const workflowIdFromUrl = params?.id as string | undefined;

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodeStatus,
    setNodeOutput,
    setNodeError,
    clearExecutionState,
    undo,
    redo,
    canUndo,
    canRedo,
    pushHistory,
  } = useWorkflowStore();

  const { startRun, updateNodeInRun, finishRun } = useHistoryStore();
  const {
    createRun,
    updateNodeRun,
    finishRun: finishRunDB,
    loadHistoricalRuns,
  } = useWorkflowRunPersistence();

  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RunResult>(null);
  const [resultMsg, setResultMsg] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("Untitled");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(workflowName);
  const abortRef = useRef<AbortController | null>(null);
  const dbRunIdRef = useRef<string | null>(null);

  // Sync workflowId from URL and clear canvas for new workflows
  useEffect(() => {
    if (workflowIdFromUrl === "new") {
      // New workflow - clear everything
      setWorkflowId(null);
      setWorkflowName("Untitled");
      setNodes([]);
      setEdges([]);
      clearExecutionState();
      setLastResult(null);
    } else if (workflowIdFromUrl) {
      // Existing workflow - load it
      setWorkflowId(workflowIdFromUrl);
      loadHistoricalRuns(workflowIdFromUrl);

      const loadWorkflow = async () => {
        try {
          const res = await fetch("/api/workflows");
          const data = await res.json();
          const workflow = data.workflows?.find(
            (w: any) => w.id === workflowIdFromUrl,
          );
          if (workflow) {
            setWorkflowName(workflow.name);
            setNodes(workflow.nodes || []);
            setEdges(workflow.edges || []);
          }
        } catch (err) {
          console.error("Failed to load workflow:", err);
        }
      };
      loadWorkflow();
    }
  }, [
    workflowIdFromUrl,
    setNodes,
    setEdges,
    clearExecutionState,
    loadHistoricalRuns,
  ]);

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      setIsEditingName(false);
      return;
    }

    // No DB record yet — just update local state; name will persist on next Save
    if (!workflowId) {
      setWorkflowName(tempName.trim());
      setIsEditingName(false);
      return;
    }

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workflowId,
          name: tempName.trim(),
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
          })),
        }),
      });

      if (res.ok) {
        setWorkflowName(tempName.trim());
        setIsEditingName(false);
      }
    } catch (err) {
      console.error("Failed to save workflow name:", err);
    }
  };

  /* ── Execute ──────────────────────────────────────────────────────── */
  const execute = useCallback(
    async (scope: ExecutionScope) => {
      if (running || nodes.length === 0) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setRunning(true);
      setLastResult(null);
      clearExecutionState();

      // Create database run entry
      const scopeLabel: import("@/lib/historyStore").RunScope =
        scope.type === "selected" ? "partial" : "full";
      const dbRunId = await createRun(workflowId ?? undefined, scopeLabel);
      dbRunIdRef.current = dbRunId;

      // Start history run (in-memory)
      const runId = generateRunId();
      const nodeList = nodes.map(
        (n: { id: string; type?: string; data: Record<string, unknown> }) => ({
          id: n.id,
          type: n.type ?? "unknown",
          label: (n.data.label as string) ?? n.type ?? n.id,
        }),
      );
      startRun(runId, nodeList, scopeLabel, dbRunId ?? undefined);

      const nodeStartTimes: Record<string, number> = {};

      try {
        // Seed with existing store outputs so uploaded images flow through
        const existingOutputs = new Map(
          Object.entries(useWorkflowStore.getState().nodeOutputs),
        );

        const outputs = await runWorkflow(
          nodes,
          edges,
          scope,
          {
            onStatus: (id: string, s: NodeStatus) => {
              setNodeStatus(id, s);
              const node = nodes.find((n) => n.id === id);
              const nodeType = node?.type ?? "unknown";
              const nodeLabel = (node?.data?.label as string) ?? nodeType ?? id;
              const durationMs = nodeStartTimes[id]
                ? Date.now() - nodeStartTimes[id]
                : null;

              if (s === "running") {
                // Real execution started - update timestamp
                nodeStartTimes[id] = Date.now();
                updateNodeInRun(runId, id, { status: "running" });
                updateNodeRun(id, nodeType, nodeLabel, { status: "running" });
              } else if (s === "success") {
                updateNodeInRun(runId, id, {
                  status: "success",
                  finishedAt: Date.now(),
                  durationMs,
                });
                updateNodeRun(id, nodeType, nodeLabel, {
                  status: "success",
                  durationMs: durationMs ?? 0,
                });
              } else if (s === "error") {
                updateNodeInRun(runId, id, {
                  status: "failed",
                  finishedAt: Date.now(),
                  durationMs,
                });
                updateNodeRun(id, nodeType, nodeLabel, {
                  status: "failed",
                  durationMs: durationMs ?? 0,
                });
              } else if (s === "skipped") {
                updateNodeInRun(runId, id, { status: "skipped" });
                updateNodeRun(id, nodeType, nodeLabel, { status: "skipped" });
              }
            },
            onOutput: (id: string, o: string) => {
              setNodeOutput(id, o);
              updateNodeInRun(runId, id, { output: o });
              const node = nodes.find((n) => n.id === id);
              // Collect inputs from connected edges for history tracking
              const inputsMap: Record<string, string> = {};
              edges
                .filter((e) => e.target === id)
                .forEach((e) => {
                  const srcOutput = useWorkflowStore.getState().nodeOutputs[e.source];
                  if (srcOutput) inputsMap[e.targetHandle ?? e.source] = srcOutput.slice(0, 200);
                });
              updateNodeInRun(runId, id, {
                output: o,
                inputs: Object.keys(inputsMap).length > 0 ? inputsMap : undefined,
              });
              updateNodeRun(
                id,
                node?.type ?? "unknown",
                (node?.data?.label as string) ?? node?.type ?? id,
                { output: o, inputs: Object.keys(inputsMap).length > 0 ? inputsMap : undefined },
              );
            },
            onError: (id: string, e: string) => {
              setNodeError(id, e);
              updateNodeInRun(runId, id, { error: e });
              const node = nodes.find((n) => n.id === id);
              updateNodeRun(
                id,
                node?.type ?? "unknown",
                (node?.data?.label as string) ?? node?.type ?? id,
                { error: e },
              );
            },
          },
          controller.signal,
          existingOutputs,
        );

        if (controller.signal.aborted) {
          // Reset all running nodes to idle on cancellation
          for (const node of nodes) {
            if (useWorkflowStore.getState().nodeStatus[node.id] === "running") {
              setNodeStatus(node.id, "idle");
            }
          }
          setLastResult("error");
          setResultMsg("Execution cancelled");
          finishRun(runId, "cancelled");
          finishRunDB("cancelled");
          return;
        }

        const successCount = [...outputs.keys()].length;
        setLastResult("success");
        setResultMsg(
          `${successCount} node${successCount !== 1 ? "s" : ""} completed`,
        );
        // calculateRunStatus is called inside finishRun in the store
        finishRun(runId, "success");
        // Compute partial/failed for DB based on actual node results
        const storeRun = useHistoryStore.getState().runs.find((r) => r.runId === runId);
        const dbStatus = storeRun?.status ?? "success";
        finishRunDB(dbStatus as import("@/lib/historyStore").RunStatus);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // Reset all running nodes to idle on error
          for (const node of nodes) {
            if (useWorkflowStore.getState().nodeStatus[node.id] === "running") {
              setNodeStatus(node.id, "idle");
            }
          }
          setLastResult("error");
          setResultMsg("Execution failed — check console");
          console.error("Workflow error:", err);
          finishRun(runId, "failed");
          finishRunDB("failed");
        }
      } finally {
        setRunning(false);
        abortRef.current = null;
      }
    },
    [
      running,
      nodes,
      edges,
      workflowId,
      clearExecutionState,
      setNodeStatus,
      setNodeOutput,
      setNodeError,
      startRun,
      updateNodeInRun,
      finishRun,
      createRun,
      updateNodeRun,
      finishRunDB,
    ],
  );

  const handleStop = () => {
    abortRef.current?.abort();
    setRunning(false);
    setLastResult("error");
    setResultMsg("Stopped by user");
  };

  const handleRunAll = () => execute({ type: "full" });
  const handleRunSelected = () => {
    const ids = nodes.filter((n) => n.selected).map((n) => n.id);
    if (!ids.length) {
      setLastResult("error");
      setResultMsg("Select nodes first (click or Shift+click)");
      return;
    }
    execute({ type: "selected", nodeIds: ids });
  };

  const handleClear = () => {
    if (!window.confirm("Clear the entire canvas? This cannot be undone."))
      return;
    setNodes([]);
    setEdges([]);
    clearExecutionState();
    setLastResult(null);
  };

  const handleExport = () => {
    const payload = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = () => {
    if (nodes.length > 0) {
      if (
        !window.confirm(
          "This will replace your current canvas with the sample workflow. Continue?",
        )
      )
        return;
    }
    pushHistory();
    const { nodes: sampleNodes, edges: sampleEdges } = buildSampleWorkflow();
    setNodes(sampleNodes as Parameters<typeof setNodes>[0]);
    setEdges(sampleEdges);
    clearExecutionState();
    setLastResult(null);
  };

  const handleSave = async () => {
    if (nodes.length === 0 || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workflowId ?? undefined,
          name: workflowName,
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setWorkflowId(json.workflow.id);
      setLastResult("success");
      setResultMsg("Workflow saved");
    } catch (err) {
      setLastResult("error");
      setResultMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = nodes.filter((n) => n.selected).length;
  const canRun = !running && nodes.length > 0;

  return (
    <>
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          background: "#0f0f0f",
          borderBottom: "1px solid #1e1e1e",
          zIndex: 50,
        }}
      >
        {/* ── LEFT ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link
            href="/dashboard/node-editor"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              color: "#555",
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "#1e1e1e";
              (e.currentTarget as HTMLAnchorElement).style.color = "#d0d0d0";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color = "#555";
            }}
            title="Back to workflows"
          >
            <ArrowLeft size={14} />
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <img
              src="/images/logo.png"
              alt="Galaxy Logo"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                objectFit: "cover",
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#e0e0e0",
                letterSpacing: "-0.02em",
              }}
            >
              NextFlow
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: "#222" }} />

          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") {
                  setTempName(workflowName);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                padding: "4px 8px",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                outline: "none",
                width: 150,
              }}
            />
          ) : (
            <div
              onClick={() => {
                setTempName(workflowName);
                setIsEditingName(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent";
              }}
            >
              <span style={{ fontSize: 13, color: "#999", fontWeight: 500 }}>
                {workflowName}
              </span>
              <ChevronDown size={11} color="#444" />
            </div>
          )}
        </div>

        {/* ── CENTER ──────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#3a3a3a",
              background: "#161616",
              border: "1px solid #222",
              borderRadius: 5,
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {nodes.length} node{nodes.length !== 1 ? "s" : ""} · {edges.length}{" "}
            edge{edges.length !== 1 ? "s" : ""}
          </span>

          {selectedCount > 0 && (
            <span
              style={{
                fontSize: 11,
                color: "#8b5cf6",
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.2)",
                borderRadius: 5,
                padding: "2px 8px",
              }}
            >
              {selectedCount} selected
            </span>
          )}

          {lastResult && (
            <span
              style={{
                fontSize: 11,
                color: lastResult === "success" ? "#22c55e" : "#ef4444",
                background:
                  lastResult === "success"
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(239,68,68,0.08)",
                border: `1px solid ${lastResult === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                borderRadius: 5,
                padding: "2px 8px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {lastResult === "success" ? (
                <CheckCircle2 size={10} />
              ) : (
                <XCircle size={10} />
              )}
              {resultMsg}
            </span>
          )}
        </div>

        {/* ── RIGHT ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* History button */}
          <TopBtn
            onClick={() => setHistoryOpen((v) => !v)}
            title="Workflow run history"
            icon={<History size={13} />}
            label="History"
            active={historyOpen}
          />

          <Divider />

          <TopBtn
            onClick={handleLoadSample}
            title="Load sample workflow"
            icon={<Sparkles size={13} />}
            label="Sample"
            accent
          />

          <Divider />

          <TopBtn
            onClick={undo}
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
            icon={<Undo2 size={13} />}
            label="Undo"
          />
          <TopBtn
            onClick={redo}
            disabled={!canRedo()}
            title="Redo (Ctrl+Shift+Z)"
            icon={<Redo2 size={13} />}
            label="Redo"
          />

          <Divider />

          <TopBtn
            onClick={handleClear}
            disabled={running}
            title="Clear canvas"
            icon={<Trash2 size={13} />}
            label="Clear"
            danger
          />
          <TopBtn
            onClick={handleExport}
            disabled={nodes.length === 0}
            title="Export JSON"
            icon={<Download size={13} />}
            label="Export"
          />
          <TopBtn
            onClick={handleSave}
            disabled={nodes.length === 0 || saving}
            title="Save workflow to database"
            icon={
              saving ? (
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Save size={13} />
              )
            }
            label={saving ? "Saving…" : "Save"}
            accent
          />

          <Divider />

          {running && (
            <button
              onClick={handleStop}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 7,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Square size={12} fill="currentColor" /> Stop
            </button>
          )}

          {!running && (
            <button
              onClick={handleRunSelected}
              disabled={!canRun}
              title={
                selectedCount > 0
                  ? `Run ${selectedCount} selected + deps`
                  : "Select nodes first"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 7,
                background:
                  canRun && selectedCount > 0
                    ? "rgba(139,92,246,0.1)"
                    : "transparent",
                border: `1px solid ${canRun && selectedCount > 0 ? "rgba(139,92,246,0.25)" : "transparent"}`,
                color: !canRun
                  ? "#2a2a2a"
                  : selectedCount > 0
                    ? "#a78bfa"
                    : "#555",
                fontSize: 12,
                fontWeight: 500,
                cursor: !canRun ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                if (canRun) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(139,92,246,0.15)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#c4b5fd";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  canRun && selectedCount > 0
                    ? "rgba(139,92,246,0.1)"
                    : "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = !canRun
                  ? "#2a2a2a"
                  : selectedCount > 0
                    ? "#a78bfa"
                    : "#555";
              }}
            >
              <MousePointerClick size={13} /> Run Selected
            </button>
          )}

          <button
            onClick={running ? handleStop : handleRunAll}
            disabled={!running && !canRun}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              background:
                !canRun && !running
                  ? "#161616"
                  : running
                    ? "linear-gradient(135deg,#ef4444,#dc2626)"
                    : "linear-gradient(135deg,#22c55e,#16a34a)",
              border: `1px solid ${!canRun && !running ? "#222" : running ? "#dc2626" : "#16a34a"}`,
              color: !canRun && !running ? "#333" : "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: !canRun && !running ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              transition: "opacity 0.12s",
            }}
            onMouseEnter={(e) => {
              if (canRun || running)
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
          >
            {running ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Running…
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" /> Run Workflow
              </>
            )}
          </button>
        </div>
      </div>

      {/* History sidebar — overlays canvas via position:fixed in HistorySidebar */}
      <HistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function Divider() {
  return (
    <div
      style={{ width: 1, height: 18, background: "#222", margin: "0 3px" }}
    />
  );
}

function TopBtn({
  onClick,
  disabled,
  title,
  icon,
  label,
  danger,
  accent,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  accent?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 9px",
        borderRadius: 7,
        background: active
          ? "rgba(234,179,8,0.12)"
          : accent
            ? "rgba(139,92,246,0.1)"
            : "transparent",
        border: `1px solid ${active ? "rgba(234,179,8,0.25)" : accent ? "rgba(139,92,246,0.2)" : "transparent"}`,
        color: disabled
          ? "#2a2a2a"
          : active
            ? "#eab308"
            : accent
              ? "#a78bfa"
              : "#555",
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = danger
            ? "rgba(239,68,68,0.1)"
            : active
              ? "rgba(234,179,8,0.18)"
              : accent
                ? "rgba(139,92,246,0.18)"
                : "#1a1a1a";
          (e.currentTarget as HTMLButtonElement).style.borderColor = danger
            ? "rgba(239,68,68,0.25)"
            : active
              ? "rgba(234,179,8,0.35)"
              : accent
                ? "rgba(139,92,246,0.35)"
                : "#2a2a2a";
          (e.currentTarget as HTMLButtonElement).style.color = danger
            ? "#ef4444"
            : active
              ? "#fbbf24"
              : accent
                ? "#c4b5fd"
                : "#d0d0d0";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = active
          ? "rgba(234,179,8,0.12)"
          : accent
            ? "rgba(139,92,246,0.1)"
            : "transparent";
        (e.currentTarget as HTMLButtonElement).style.borderColor = active
          ? "rgba(234,179,8,0.25)"
          : accent
            ? "rgba(139,92,246,0.2)"
            : "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = disabled
          ? "#2a2a2a"
          : active
            ? "#eab308"
            : accent
              ? "#a78bfa"
              : "#555";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * src/components/canvas/EditorToolbar.tsx
 *
 * Top toolbar for the node editor. Responsibilities:
 *  - Undo / Redo buttons (read from workflowStore history)
 *  - Run Workflow  → full execution (all nodes)
 *  - Run Selected  → selective execution (selected nodes + their deps)
 *  - Clear canvas
 *  - Export JSON
 *  - Live node/edge counter + execution status banner
 */

"use client";

import { useState } from "react";
import {
  Play,
  Trash2,
  Download,
  GitFork,
  Loader2,
  Undo2,
  Redo2,
  MousePointerClick,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useWorkflowStore } from "@/store/workflowStore";
import { runWorkflow, type ExecutionCallbacks } from "@/lib/execution";
import type { ExecutionScope } from "@/types/nodes";

/* ─── Execution result banner type ──────────────────────────────────── */
type RunResult = "success" | "error" | null;

export default function EditorToolbar() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    updateNodeData,
    undo,
    redo,
    canUndo,
    canRedo,
    setNodeError,
  } = useWorkflowStore();

  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RunResult>(null);
  const [resultMsg, setResultMsg] = useState("");

  /* ── Shared execution runner ─────────────────────────────────────── */

  async function executeWorkflow(scope: ExecutionScope = { type: "full" }) {
    if (running || nodes.length === 0) return;

    setRunning(true);
    setLastResult(null);

    try {
      const callbacks: ExecutionCallbacks = {
        onStatus: (nodeId: string, status) => {
          updateNodeData(nodeId, { status });
        },
        onOutput: (nodeId: string, output: string) => {
          updateNodeData(nodeId, { output });
        },
        onError: (nodeId: string, error: string) => {
          setNodeError(nodeId, error);
        },
      };

      await runWorkflow(nodes, edges, scope, callbacks);

      setLastResult("success");
      setResultMsg("Workflow completed successfully");
    } catch (err) {
      setLastResult("error");
      setResultMsg("Execution failed — check console");
      console.error("Workflow execution error:", err);
    } finally {
      setRunning(false);
    }
  }

  /* ── Run full workflow ────────────────────────────────────────────── */
  const handleRunAll = () => executeWorkflow();

  /* ── Run only selected nodes + their upstream deps ───────────────── */
  const handleRunSelected = () => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);

    if (selectedIds.length === 0) {
      setLastResult("error");
      setResultMsg("No nodes selected — click nodes first");
      return;
    }
    executeWorkflow({ type: "selected", nodeIds: selectedIds });
  };

  /* ── Clear canvas ─────────────────────────────────────────────────── */
  const handleClear = () => {
    if (!window.confirm("Clear the entire canvas? This cannot be undone."))
      return;
    setNodes([]);
    setEdges([]);
    setLastResult(null);
  };

  /* ── Export JSON ──────────────────────────────────────────────────── */
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

  const selectedCount = nodes.filter((n) => n.selected).length;
  const canRun = !running && nodes.length > 0;

  return (
    <div
      style={{
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        background: "#111",
        borderBottom: "1px solid #1e1e1e",
        flexShrink: 0,
        gap: 8,
      }}
    >
      {/* ── LEFT: identity + counters ──────────────────────────────── */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
      >
        <GitFork size={14} color="#8b5cf6" style={{ flexShrink: 0 }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#d0d0d0",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          Workflow Builder
        </span>

        {/* Node / edge counter */}
        <span
          style={{
            fontSize: 11,
            color: "#444",
            background: "#1a1a1a",
            border: "1px solid #222",
            borderRadius: 5,
            padding: "2px 7px",
            whiteSpace: "nowrap",
          }}
        >
          {nodes.length} node{nodes.length !== 1 ? "s" : ""} · {edges.length}{" "}
          edge{edges.length !== 1 ? "s" : ""}
        </span>

        {/* Selected count badge */}
        {selectedCount > 0 && (
          <span
            style={{
              fontSize: 11,
              color: "#8b5cf6",
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: 5,
              padding: "2px 7px",
              whiteSpace: "nowrap",
            }}
          >
            {selectedCount} selected
          </span>
        )}

        {/* Execution result banner */}
        {lastResult && (
          <span
            style={{
              fontSize: 11,
              color: lastResult === "success" ? "#22c55e" : "#ef4444",
              background:
                lastResult === "success"
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(239,68,68,0.1)",
              border: `1px solid ${lastResult === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              borderRadius: 5,
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
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

      {/* ── RIGHT: action buttons ──────────────────────────────────── */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
      >
        {/* Undo */}
        <TbBtn
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
          icon={<Undo2 size={13} />}
          label="Undo"
        />

        {/* Redo */}
        <TbBtn
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Shift+Z)"
          icon={<Redo2 size={13} />}
          label="Redo"
        />

        {/* Divider */}
        <div
          style={{ width: 1, height: 20, background: "#222", margin: "0 4px" }}
        />

        {/* Clear */}
        <TbBtn
          onClick={handleClear}
          disabled={running}
          title="Clear canvas"
          icon={<Trash2 size={13} />}
          label="Clear"
          danger
        />

        {/* Export */}
        <TbBtn
          onClick={handleExport}
          disabled={nodes.length === 0}
          title="Export workflow as JSON"
          icon={<Download size={13} />}
          label="Export"
        />

        {/* Divider */}
        <div
          style={{ width: 1, height: 20, background: "#222", margin: "0 4px" }}
        />

        {/* Run Selected */}
        <button
          onClick={handleRunSelected}
          disabled={!canRun}
          title={
            selectedCount > 0
              ? `Run ${selectedCount} selected node${selectedCount !== 1 ? "s" : ""} + their dependencies`
              : "Select nodes on canvas first, then click"
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 11px",
            borderRadius: 7,
            background: !canRun
              ? "transparent"
              : selectedCount > 0
                ? "rgba(139,92,246,0.12)"
                : "transparent",
            border: `1px solid ${
              !canRun
                ? "transparent"
                : selectedCount > 0
                  ? "rgba(139,92,246,0.3)"
                  : "transparent"
            }`,
            color: !canRun ? "#333" : selectedCount > 0 ? "#a78bfa" : "#555",
            fontSize: 12,
            fontWeight: 500,
            cursor: !canRun ? "not-allowed" : "pointer",
            transition: "all 0.12s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (canRun) {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(139,92,246,0.18)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(139,92,246,0.4)";
              (e.currentTarget as HTMLButtonElement).style.color = "#c4b5fd";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              canRun && selectedCount > 0
                ? "rgba(139,92,246,0.12)"
                : "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              canRun && selectedCount > 0
                ? "rgba(139,92,246,0.3)"
                : "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = !canRun
              ? "#333"
              : selectedCount > 0
                ? "#a78bfa"
                : "#555";
          }}
        >
          <MousePointerClick size={13} />
          Run Selected
        </button>

        {/* Run Workflow (full) */}
        <button
          onClick={handleRunAll}
          disabled={!canRun}
          title="Run full workflow (all nodes in order)"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 8,
            background: !canRun
              ? "#1a1a1a"
              : running
                ? "#1a1a1a"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
            border: `1px solid ${!canRun || running ? "#282828" : "#16a34a"}`,
            color: !canRun ? "#333" : "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: !canRun ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (canRun)
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          }}
        >
          {running ? (
            <Loader2
              size={13}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
          {running ? "Running…" : "Run Workflow"}
        </button>
      </div>
    </div>
  );
}

/* ─── Reusable toolbar ghost button ─────────────────────────────────── */

function TbBtn({
  onClick,
  disabled,
  title,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
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
        padding: "5px 10px",
        borderRadius: 7,
        background: "transparent",
        border: "1px solid transparent",
        color: disabled ? "#2a2a2a" : danger ? "#666" : "#666",
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.12s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = danger
            ? "rgba(239,68,68,0.1)"
            : "#1e1e1e";
          (e.currentTarget as HTMLButtonElement).style.borderColor = danger
            ? "rgba(239,68,68,0.3)"
            : "#2a2a2a";
          (e.currentTarget as HTMLButtonElement).style.color = danger
            ? "#ef4444"
            : "#d0d0d0";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = disabled
          ? "#2a2a2a"
          : "#666";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

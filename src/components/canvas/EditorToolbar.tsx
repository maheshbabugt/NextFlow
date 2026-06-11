/**
 * src/components/canvas/EditorToolbar.tsx
 *
 * Thin top bar for the node editor.
 * Provides: workflow name, Run button, Clear canvas, Export JSON.
 */

"use client";

import { useState } from "react";
import { Play, Trash2, Download, GitFork, Loader2 } from "lucide-react";
import { useWorkflowStore } from "@/store/workflowStore";
import { topologicalSort } from "@/lib/graphUtils";

export default function EditorToolbar() {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();
  const [running, setRunning] = useState(false);

  /* Simulated run — just shows loading state for 1.5s */
  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    const ordered = topologicalSort(
      nodes as Parameters<typeof topologicalSort>[0],
      edges,
    );
    console.log(
      "▶ Execution order:",
      ordered.map((n) => `${n.type}(${n.id})`),
    );
    await new Promise((r) => setTimeout(r, 1500));
    setRunning(false);
  };

  const handleClear = () => {
    if (window.confirm("Clear the entire canvas?")) {
      setNodes([]);
      setEdges([]);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "#111",
        borderBottom: "1px solid #1e1e1e",
        flexShrink: 0,
        gap: 12,
      }}
    >
      {/* Left: workflow identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <GitFork size={14} color="#8b5cf6" />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#d0d0d0",
            letterSpacing: "-0.01em",
          }}
        >
          Workflow Builder
        </span>
        <span
          style={{
            fontSize: 11,
            color: "#444",
            background: "#1a1a1a",
            border: "1px solid #282828",
            borderRadius: 5,
            padding: "2px 7px",
          }}
        >
          {nodes.length} node{nodes.length !== 1 ? "s" : ""} · {edges.length}{" "}
          edge{edges.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Right: action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Clear */}
        <TbBtn
          onClick={handleClear}
          title="Clear canvas"
          icon={<Trash2 size={13} />}
          label="Clear"
          danger
        />

        {/* Export */}
        <TbBtn
          onClick={handleExport}
          title="Export JSON"
          icon={<Download size={13} />}
          label="Export"
        />

        {/* Run */}
        <button
          onClick={handleRun}
          disabled={running || nodes.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 8,
            background:
              running || nodes.length === 0
                ? "#1a1a1a"
                : "linear-gradient(135deg,#22c55e,#16a34a)",
            border: `1px solid ${running || nodes.length === 0 ? "#282828" : "#16a34a"}`,
            color: running || nodes.length === 0 ? "#444" : "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: running || nodes.length === 0 ? "not-allowed" : "pointer",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!running && nodes.length > 0)
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

/* Small toolbar icon-button */
function TbBtn({
  onClick,
  title,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 11px",
        borderRadius: 7,
        background: hov
          ? danger
            ? "rgba(239,68,68,0.12)"
            : "#1e1e1e"
          : "transparent",
        border: "1px solid",
        borderColor: hov ? (danger ? "#ef444455" : "#2a2a2a") : "transparent",
        color: hov ? (danger ? "#ef4444" : "#d0d0d0") : "#666",
        fontSize: 12,
        cursor: "pointer",
        transition: "all 0.12s ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * src/components/canvas/HistorySidebar.tsx
 *
 * Krea-style workflow run history panel.
 * Collapsible run cards with full node-level detail.
 */

"use client";

import { useState } from "react";
import {
  X, CheckCircle2, XCircle, Loader2, Clock,
  SkipForward, ChevronDown, ChevronRight, AlertTriangle,
} from "lucide-react";
import { useHistoryStore } from "@/lib/historyStore";
import {
  formatRunDuration,
  formatRunTimestamp,
  formatNodeDuration,
  getScopeLabel,
} from "@/lib/historyStore";
import type { WorkflowRun, NodeRunRecord, NodeRunStatus, RunStatus, RunScope } from "@/lib/historyStore";

interface Props {
  open:    boolean;
  onClose: () => void;
}

/* ─── Status colours ─────────────────────────────────────────────────── */

const STATUS_COLOR: Record<RunStatus, string> = {
  running:   "#8b5cf6",
  success:   "#22c55e",
  failed:    "#ef4444",
  partial:   "#f97316",
  cancelled: "#f59e0b",
};

const NODE_STATUS_COLOR: Record<NodeRunStatus, string> = {
  pending: "#3a3a3a",
  running: "#8b5cf6",
  success: "#22c55e",
  failed:  "#ef4444",
  skipped: "#555",
};

const SCOPE_COLOR: Record<RunScope, string> = {
  full:    "#3b82f6",
  partial: "#f97316",
  single:  "#8b5cf6",
};

/* ─── Main sidebar ───────────────────────────────────────────────────── */

export default function HistorySidebar({ open, onClose }: Props) {
  const { runs, clearHistory } = useHistoryStore();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.35)" }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed", top: 48, right: 0, bottom: 0,
          width: 360,
          background: "#0f0f0f",
          borderLeft: "1px solid #1e1e1e",
          zIndex: 41,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid #1e1e1e",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={13} color="#555" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#d0d0d0" }}>
              Run History
            </span>
            {runs.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: "#1e1e1e", color: "#555",
                borderRadius: 10, padding: "1px 7px",
              }}>
                {runs.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {runs.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  fontSize: 10, color: "#444", background: "none",
                  border: "1px solid #222", cursor: "pointer",
                  padding: "3px 8px", borderRadius: 5,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#444";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#222";
                }}
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: "none", border: "none",
                cursor: "pointer", color: "#444",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#d0d0d0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#444")}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Runs list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {runs.length === 0 ? (
            <EmptyState />
          ) : (
            runs.map((run, idx) => (
              <RunItem
                key={run.runId}
                run={run}
                runNumber={runs.length - idx}
                expanded={selectedRunId === run.runId}
                onToggle={() =>
                  setSelectedRunId((prev) => (prev === run.runId ? null : run.runId))
                }
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 20px", gap: 10,
    }}>
      <Clock size={28} color="#2a2a2a" />
      <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>
        No workflow runs yet
      </span>
      <span style={{ fontSize: 11, color: "#2a2a2a", textAlign: "center", lineHeight: 1.5 }}>
        Click Run Workflow to execute your first run
      </span>
    </div>
  );
}

/* ─── Run item (collapsible) ─────────────────────────────────────────── */

function RunItem({
  run,
  runNumber,
  expanded,
  onToggle,
}: {
  run: WorkflowRun;
  runNumber: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const color  = STATUS_COLOR[run.status];
  const scope  = getScopeLabel(run.scope);
  const scopeColor = SCOPE_COLOR[run.scope];

  const succeededCount = run.nodes.filter((n) => n.status === "success").length;
  const failedCount    = run.nodes.filter((n) => n.status === "failed").length;
  const totalCount     = run.nodes.length;

  return (
    <div
      style={{
        marginBottom: 8,
        background: expanded ? "#161616" : "#131313",
        border: `1px solid ${expanded ? "#2a2a2a" : "#1a1a1a"}`,
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Collapsed header — always visible */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px",
          cursor: "pointer",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      >
        {/* Expand chevron */}
        <div style={{ color: "#333", flexShrink: 0 }}>
          {expanded
            ? <ChevronDown size={12} />
            : <ChevronRight size={12} />}
        </div>

        {/* Status icon */}
        <RunStatusIcon status={run.status} />

        {/* Run ID */}
        <span style={{ fontSize: 12, fontWeight: 600, color: "#c0c0c0", flexShrink: 0 }}>
          Run #{runNumber}
        </span>

        {/* Scope badge */}
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
          color: scopeColor,
          background: `${scopeColor}18`,
          border: `1px solid ${scopeColor}33`,
          borderRadius: 4, padding: "1px 6px",
          flexShrink: 0,
        }}>
          {scope.toUpperCase()}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Duration */}
        <span style={{ fontSize: 10, color: "#444", flexShrink: 0 }}>
          {formatRunDuration(run.startedAt, run.finishedAt)}
        </span>
      </div>

      {/* Timestamp + node summary row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 12px 8px 32px",
      }}>
        <span style={{ fontSize: 10, color: "#3a3a3a" }}>
          {formatRunTimestamp(run.startedAt)}
        </span>
        <NodeSummaryPills
          succeeded={succeededCount}
          failed={failedCount}
          total={totalCount}
        />
      </div>

      {/* Status bar */}
      <StatusBar nodes={run.nodes} />

      {/* Expanded node details */}
      {expanded && (
        <div style={{ borderTop: "1px solid #1e1e1e" }}>
          {run.nodes.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 11, color: "#333" }}>
              No nodes executed.
            </div>
          ) : (
            run.nodes.map((node) => (
              <NodeRunItem key={node.id} node={node} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Node summary pills ─────────────────────────────────────────────── */

function NodeSummaryPills({
  succeeded, failed, total,
}: { succeeded: number; failed: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {succeeded > 0 && (
        <span style={{
          fontSize: 9, fontWeight: 600,
          color: "#22c55e", background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 4, padding: "1px 5px",
        }}>
          {succeeded}/{total} ok
        </span>
      )}
      {failed > 0 && (
        <span style={{
          fontSize: 9, fontWeight: 600,
          color: "#ef4444", background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 4, padding: "1px 5px",
        }}>
          {failed} failed
        </span>
      )}
    </div>
  );
}

/* ─── Progress bar across node statuses ─────────────────────────────── */

function StatusBar({ nodes }: { nodes: NodeRunRecord[] }) {
  if (nodes.length === 0) return null;
  return (
    <div style={{
      display: "flex", height: 2, margin: "0 12px 8px",
      borderRadius: 2, overflow: "hidden", gap: 1,
    }}>
      {nodes.map((n) => (
        <div
          key={n.id}
          style={{
            flex: 1,
            background: NODE_STATUS_COLOR[n.status],
            opacity: n.status === "pending" ? 0.2 : 1,
            transition: "background 0.3s",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Node run item (expanded detail) ───────────────────────────────── */

function NodeRunItem({ node }: { node: NodeRunRecord }) {
  const [showInputs, setShowInputs] = useState(false);
  const color = NODE_STATUS_COLOR[node.status];

  return (
    <div style={{
      padding: "8px 12px",
      borderBottom: "1px solid #181818",
    }}>
      {/* Node header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        <NodeStatusIcon status={node.status} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#c0c0c0", flex: 1 }}>
          {node.label || node.type}
        </span>
        <span style={{
          fontSize: 9, color: "#3a3a3a",
          background: "#1a1a1a", borderRadius: 4,
          padding: "1px 5px", fontFamily: "monospace",
        }}>
          {node.type}
        </span>
        {node.durationMs != null && (
          <span style={{ fontSize: 9, color: "#444" }}>
            {formatNodeDuration(node.durationMs)}
          </span>
        )}
      </div>

      {/* Node ID */}
      <div style={{ fontSize: 9, color: "#2e2e2e", marginBottom: 4, fontFamily: "monospace" }}>
        id: {node.id}
      </div>

      {/* Error message */}
      {node.status === "failed" && node.error && (
        <div style={{
          display: "flex", gap: 5, alignItems: "flex-start",
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 5, padding: "5px 8px", marginBottom: 4,
        }}>
          <AlertTriangle size={9} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 10, color: "#f87171", lineHeight: 1.5, wordBreak: "break-word" }}>
            {node.error}
          </span>
        </div>
      )}

      {/* Output */}
      {node.status === "success" && node.output && (
        <OutputPreview output={node.output} />
      )}

      {/* Inputs toggle */}
      {node.inputs && Object.keys(node.inputs).length > 0 && (
        <div style={{ marginTop: 4 }}>
          <button
            onClick={() => setShowInputs((v) => !v)}
            style={{
              fontSize: 9, color: "#444", background: "none",
              border: "none", cursor: "pointer", padding: 0,
              display: "flex", alignItems: "center", gap: 3,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#888")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#444")}
          >
            {showInputs ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
            Inputs used
          </button>
          {showInputs && (
            <div style={{
              marginTop: 4,
              background: "#0e0e0e",
              border: "1px solid #1e1e1e",
              borderRadius: 5, padding: "5px 8px",
              fontSize: 9, color: "#555",
              fontFamily: "monospace",
              lineHeight: 1.6,
              maxHeight: 80, overflowY: "auto",
              wordBreak: "break-all",
            }}>
              {Object.entries(node.inputs).map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: "#3b82f6" }}>{k}</span>
                  {": "}
                  <span>{typeof v === "string" && v.length > 60 ? v.slice(0, 60) + "…" : String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Output preview ─────────────────────────────────────────────────── */

function OutputPreview({ output }: { output: string }) {
  const isImage = output.startsWith("data:image/") || output.match(/\.(png|jpg|jpeg|webp|gif)(\?|$)/i);
  const isUrl   = output.startsWith("http://") || output.startsWith("https://");

  if (isImage || isUrl) {
    return (
      <div style={{
        marginTop: 4,
        background: "#0e0e0e",
        border: "1px solid #1e1e1e",
        borderRadius: 5, padding: "4px",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {isImage && (
          <img
            src={output}
            alt="output"
            style={{
              width: 36, height: 36, objectFit: "cover",
              borderRadius: 4, flexShrink: 0,
              border: "1px solid #2a2a2a",
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <a
          href={output}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 9, color: "#3b82f6",
            textDecoration: "none",
            overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap", flex: 1,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")}
        >
          {output.length > 50 ? output.slice(0, 50) + "…" : output}
        </a>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 4,
      background: "#0e0e0e",
      border: "1px solid #1e1e1e",
      borderRadius: 5, padding: "5px 8px",
      fontSize: 10, color: "#666",
      lineHeight: 1.5,
      maxHeight: 60, overflowY: "auto",
      wordBreak: "break-word",
    }}>
      {output.length > 120 ? output.slice(0, 120) + "…" : output}
    </div>
  );
}

/* ─── Status icons ───────────────────────────────────────────────────── */

function RunStatusIcon({ status }: { status: RunStatus }) {
  const sz = 12;
  if (status === "running")   return <Loader2 size={sz} color="#8b5cf6" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />;
  if (status === "success")   return <CheckCircle2 size={sz} color="#22c55e" style={{ flexShrink: 0 }} />;
  if (status === "failed")    return <XCircle size={sz} color="#ef4444" style={{ flexShrink: 0 }} />;
  if (status === "partial")   return <AlertTriangle size={sz} color="#f97316" style={{ flexShrink: 0 }} />;
  if (status === "cancelled") return <XCircle size={sz} color="#f59e0b" style={{ flexShrink: 0 }} />;
  return null;
}

function NodeStatusIcon({ status }: { status: NodeRunStatus }) {
  const sz = 10;
  const style = { flexShrink: 0 as const };
  if (status === "running")  return <Loader2 size={sz} color="#8b5cf6" style={{ ...style, animation: "spin 1s linear infinite" }} />;
  if (status === "success")  return <CheckCircle2 size={sz} color="#22c55e" style={style} />;
  if (status === "failed")   return <XCircle size={sz} color="#ef4444" style={style} />;
  if (status === "skipped")  return <SkipForward size={sz} color="#555" style={style} />;
  return <Clock size={sz} color="#2a2a2a" style={style} />;
}

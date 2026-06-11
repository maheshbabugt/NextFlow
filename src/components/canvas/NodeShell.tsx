/**
 * src/components/canvas/NodeShell.tsx
 *
 * Shared wrapper for every node.
 * Reads status / output / error from the Zustand store directly —
 * no props needed for execution state.
 *
 * Output panel is smart:
 *   image / crop / extract  → shows actual image + download button
 *   video                   → shows video player + download button
 *   text / llm              → shows text output
 */

"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Play,
  RotateCcw,
  Download,
  ExternalLink,
  Copy,
} from "lucide-react";
import type { NodeKind, NodeStatus } from "@/types/nodes";
import { useWorkflowStore } from "@/store/workflowStore";
import { runWorkflow } from "@/lib/execution/engine";

/* ─── Per-kind meta ──────────────────────────────────────────────────── */

const KIND_META: Record<NodeKind, { color: string; icon: string }> = {
  text: { color: "#3b82f6", icon: "✏️" },
  image: { color: "#8b5cf6", icon: "🖼️" },
  video: { color: "#ec4899", icon: "🎬" },
  llm: { color: "#22c55e", icon: "🤖" },
  crop: { color: "#f59e0b", icon: "✂️" },
  extract: { color: "#06b6d4", icon: "🎞️" },
};

const STATUS_BORDER: Record<NodeStatus, string> = {
  idle: "#252525",
  running: "#8b5cf6",
  success: "#22c55e",
  error: "#ef4444",
  skipped: "#2e2e2e",
};

/* ─── Props ──────────────────────────────────────────────────────────── */

interface NodeShellProps {
  nodeId: string;
  kind: NodeKind;
  label: string;
  selected?: boolean;
  children: React.ReactNode;
  minWidth?: number;
}

/* ─── Main ───────────────────────────────────────────────────────────── */

export default function NodeShell({
  nodeId,
  kind,
  label,
  selected,
  children,
  minWidth = 220,
}: NodeShellProps) {
  const { color, icon } = KIND_META[kind];

  // All execution state comes from store — no props
  const status = useWorkflowStore(
    (s) => s.nodeStatus[nodeId] ?? ("idle" as NodeStatus),
  );
  const output = useWorkflowStore((s) => s.nodeOutputs[nodeId] ?? "");
  const error = useWorkflowStore((s) => s.nodeErrors[nodeId] ?? "");
  const { nodes, edges, setNodeStatus, setNodeOutput, setNodeError } =
    useWorkflowStore();
  const deleteNodes = useWorkflowStore((s) => s.deleteNodes);

  const [nodeRunning, setNodeRunning] = useState(false);
  const isRunning = status === "running" || nodeRunning;

  // Debug: Log when running state changes
  React.useEffect(() => {
    if (isRunning) {
      console.log(
        `✨ Node ${label} (${nodeId}) is RUNNING - animation should start now!`,
      );
    }
  }, [isRunning, label, nodeId]);

  /* ── Run just this node ─────────────────────────────────────────── */
  const handleRunNode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) return;
    setNodeRunning(true);
    setNodeStatus(nodeId, "idle" as NodeStatus);
    setNodeOutput(nodeId, "");
    setNodeError(nodeId, "");
    try {
      // Pass existing store outputs so upstream nodes' results are available
      // even if they weren't re-run (e.g. image uploaded via Transloadit)
      const existingOutputs = new Map(
        Object.entries(useWorkflowStore.getState().nodeOutputs),
      );
      await runWorkflow(
        nodes,
        edges,
        { type: "single", nodeId },
        {
          onStatus: (id, s) => setNodeStatus(id, s),
          onOutput: (id, o) => setNodeOutput(id, o),
          onError: (id, e) => setNodeError(id, e),
        },
        undefined,
        existingOutputs,
      );
    } catch {
      /* errors broadcast via callbacks */
    } finally {
      setNodeRunning(false);
    }
  };

  /* ── Visual state ───────────────────────────────────────────────── */
  const borderColor = selected ? color : STATUS_BORDER[status];
  let shadow: string = "0 4px 20px rgba(0,0,0,0.5)";

  if (selected) {
    shadow = `0 0 0 2px ${color}55, 0 4px 20px rgba(0,0,0,0.5)`;
  } else if (!isRunning && status === "success") {
    shadow = `0 0 18px rgba(34,197,94,0.2), 0 4px 20px rgba(0,0,0,0.5)`;
  } else if (!isRunning && status === "error") {
    shadow = `0 0 18px rgba(239,68,68,0.2), 0 4px 20px rgba(0,0,0,0.5)`;
  }
  // When isRunning = true, DON'T set shadow inline — let CSS animation control it!

  return (
    <div
      style={{
        minWidth,
        borderRadius: 12,
        // Add explicit border that will animate when running
        border: isRunning ? "2px solid #8b5cf6" : "2px solid transparent",
        // Pulsating animation for nodes currently executing (parallel execution visual feedback)
        animation: isRunning ? "pulseGlow 1.4s ease-in-out infinite" : "none",
        // Only apply shadow inline when NOT animating (let CSS animation handle it when running)
        boxShadow: isRunning ? undefined : shadow,
        // Smooth transitions
        transition: isRunning
          ? "none"
          : "border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
        opacity: status === "skipped" ? 0.45 : 1,
      }}
    >
      {/* Inner wrapper with overflow hidden to clip content but not shadow */}
      <div
        style={{
          background: "#141414",
          border: `1.5px solid ${borderColor}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          className="react-flow__node-drag-handle"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 8px 7px 10px",
            borderBottom: "1px solid #1e1e1e",
            background: "#0e0e0e",
            cursor: "grab",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 5px ${color}88`,
              flexShrink: 0,
            }}
          />

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#d0d0d0",
              flex: 1,
              userSelect: "none",
            }}
          >
            {icon} {label}
          </span>

          <HeaderStatus status={status} running={isRunning} />

          {/* Run Node button */}
          <RunNodeButton
            running={isRunning}
            onRun={handleRunNode}
            color={color}
          />

          {/* Delete */}
          <button
            title="Delete node"
            onClick={(e) => {
              e.stopPropagation();
              deleteNodes([nodeId]);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3a3a3a",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a";
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            <X size={11} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div style={{ padding: "10px 12px" }}>{children}</div>

        {/* ── Error panel ─────────────────────────────────────────────── */}
        {status === "error" && error && (
          <ErrorPanel
            error={error}
            onRetry={handleRunNode}
            retrying={isRunning}
          />
        )}

        {/* ── Output panel ────────────────────────────────────────────── */}
        {status === "success" && output && (
          <OutputPanel output={output} kind={kind} />
        )}
      </div>
    </div>
  );
}

/* ─── Run Node button ────────────────────────────────────────────────── */

function RunNodeButton({
  running,
  onRun,
  color,
}: {
  running: boolean;
  onRun: (e: React.MouseEvent) => void;
  color: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onRun}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Run this node only"
      disabled={running}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 7px",
        borderRadius: 5,
        background: running
          ? "rgba(139,92,246,0.15)"
          : hov
            ? `${color}22`
            : "transparent",
        border: `1px solid ${running ? "rgba(139,92,246,0.3)" : hov ? `${color}44` : "#2a2a2a"}`,
        color: running ? "#8b5cf6" : hov ? color : "#555",
        fontSize: 10,
        fontWeight: 600,
        cursor: running ? "not-allowed" : "pointer",
        transition: "all 0.12s ease",
        whiteSpace: "nowrap",
      }}
    >
      {running ? (
        <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <Play size={9} fill="currentColor" />
      )}
      Run node
    </button>
  );
}

/* ─── Header status icon ─────────────────────────────────────────────── */

function HeaderStatus({
  status,
  running,
}: {
  status: NodeStatus;
  running: boolean;
}) {
  if (status === "idle") return null;
  if (running || status === "running")
    return (
      <Loader2
        size={11}
        color="#8b5cf6"
        style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
      />
    );
  if (status === "success")
    return <CheckCircle2 size={11} color="#22c55e" style={{ flexShrink: 0 }} />;
  if (status === "error")
    return <XCircle size={11} color="#ef4444" style={{ flexShrink: 0 }} />;
  if (status === "skipped")
    return (
      <span
        style={{
          fontSize: 9,
          color: "#555",
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: 3,
          padding: "1px 5px",
          fontWeight: 600,
        }}
      >
        SKIP
      </span>
    );
  return null;
}

/* ─── Error panel ────────────────────────────────────────────────────── */

function ErrorPanel({
  error,
  onRetry,
  retrying,
}: {
  error: string;
  onRetry: (e: React.MouseEvent) => void;
  retrying: boolean;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid rgba(239,68,68,0.2)",
        padding: "8px 12px",
        background: "rgba(239,68,68,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "#ef4444",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          marginBottom: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <AlertCircle size={9} /> Error
        </span>
        <button
          onClick={onRetry}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={retrying}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 9,
            fontWeight: 600,
            color: retrying ? "#555" : "#f87171",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 4,
            padding: "2px 6px",
            cursor: retrying ? "not-allowed" : "pointer",
          }}
        >
          {retrying ? (
            <Loader2
              size={9}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <RotateCcw size={9} />
          )}
          Retry
        </button>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#f87171",
          lineHeight: 1.5,
          wordBreak: "break-word",
          maxHeight: 80,
          overflowY: "auto",
        }}
      >
        {error}
      </div>
    </div>
  );
}

/* ─── Output panel ───────────────────────────────────────────────────── */

function OutputPanel({ output, kind }: { output: string; kind: NodeKind }) {
  /* Classify the output */
  const isBase64Image = output.startsWith("data:image/");
  const isRemoteImage =
    !isBase64Image &&
    (kind === "image" || kind === "crop" || kind === "extract") &&
    (output.startsWith("http://") || output.startsWith("https://"));
  const isRemoteVideo =
    kind === "video" &&
    (output.startsWith("http://") || output.startsWith("https://"));

  const showImage = isBase64Image || isRemoteImage;
  const showVideo = isRemoteVideo;

  /* ── Download helper ────────────────────────────────────────────── */
  const handleDownload = () => {
    const a = document.createElement("a");
    if (isBase64Image) {
      // base64 → direct download
      a.href = output;
      a.download = `nextflow-output-${Date.now()}.png`;
    } else {
      // Remote URL — open in new tab (can't force-download cross-origin)
      a.href = output;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      style={{
        borderTop: "1px solid rgba(34,197,94,0.15)",
        padding: "8px 12px",
        background: "rgba(34,197,94,0.03)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "#22c55e",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <CheckCircle2 size={9} /> Output
        </span>

        {/* Download button — shown for images and videos */}
        {(showImage || showVideo) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title={isBase64Image ? "Download image" : "Open in new tab"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 9,
              fontWeight: 600,
              color: "#22c55e",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 4,
              padding: "2px 6px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(34,197,94,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(34,197,94,0.1)";
            }}
          >
            <Download size={9} />
            {isBase64Image ? "Save" : "Open"}
          </button>
        )}
      </div>

      {/* ── Image output ────────────────────────────────────────────── */}
      {showImage && (
        <div>
          <img
            src={output}
            alt="output"
            style={{
              width: "100%",
              maxHeight: 160,
              objectFit: "contain",
              borderRadius: 7,
              border: "1px solid #2a2a2a",
              background: "#0a0a0a",
              display: "block",
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          {/* URL bar — visible for remote URLs (Transloadit / Cloudinary) */}
          {!isBase64Image && <UrlBar url={output} />}
          {isBase64Image && (
            <div style={{ fontSize: 9, color: "#444", marginTop: 4 }}>
              ✓ Processed image
            </div>
          )}
        </div>
      )}

      {/* ── Video output ────────────────────────────────────────────── */}
      {showVideo && (
        <div>
          <video
            src={output}
            controls
            muted
            style={{
              width: "100%",
              maxHeight: 120,
              borderRadius: 7,
              border: "1px solid #2a2a2a",
              background: "#000",
              display: "block",
              marginTop: 2,
            }}
          />
          <UrlBar url={output} />
        </div>
      )}

      {/* ── Text output ─────────────────────────────────────────────── */}
      {!showImage && !showVideo && (
        <div
          style={{
            fontSize: 11,
            color: "#888",
            lineHeight: 1.55,
            wordBreak: "break-word",
            maxHeight: 120,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {output}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Shared field components (used inside all node bodies)
   ═══════════════════════════════════════════════════════════════════════ */

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "#555",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export function NodeTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        background: disabled ? "#181818" : "#1e1e1e",
        border: `1px solid ${disabled ? "#1a1a1a" : "#2a2a2a"}`,
        borderRadius: 7,
        color: disabled ? "#333" : "#d0d0d0",
        fontSize: 12,
        lineHeight: 1.5,
        padding: "6px 8px",
        resize: "vertical",
        outline: "none",
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "text",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        if (!disabled)
          (e.target as HTMLTextAreaElement).style.borderColor = "#3b3b3b";
      }}
      onBlur={(e) => {
        (e.target as HTMLTextAreaElement).style.borderColor = disabled
          ? "#1a1a1a"
          : "#2a2a2a";
      }}
    />
  );
}

export function NodeInput({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  type = "text",
  inputMode,
}: {
  value: string | number;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        background: disabled ? "#181818" : "#1e1e1e",
        border: `1px solid ${disabled ? "#1a1a1a" : "#2a2a2a"}`,
        borderRadius: 7,
        color: disabled ? "#333" : "#d0d0d0",
        fontSize: 12,
        padding: "6px 8px",
        outline: "none",
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "text",
        boxSizing: "border-box",
      }}
    />
  );
}

export function NodeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        background: "#1e1e1e",
        border: "1px solid #2a2a2a",
        borderRadius: 7,
        color: "#d0d0d0",
        fontSize: 12,
        padding: "6px 8px",
        outline: "none",
        fontFamily: "inherit",
        cursor: "pointer",
        boxSizing: "border-box",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ConnectedBadge() {
  return (
    <div
      style={{
        fontSize: 10,
        color: "#8b5cf6",
        background: "rgba(139,92,246,0.1)",
        border: "1px solid rgba(139,92,246,0.2)",
        borderRadius: 5,
        padding: "3px 8px",
        display: "inline-block",
      }}
    >
      ⚡ connected via edge
    </div>
  );
}

/* ─── URL bar shown below image/video outputs ────────────────────────── */

function UrlBar({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      style={{
        marginTop: 6,
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "#0e0e0e",
        border: "1px solid #2a2a2a",
        borderRadius: 6,
        padding: "4px 6px",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Truncated URL — click to open */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={url}
        style={{
          flex: 1,
          fontSize: 9,
          color: "#3b82f6",
          textDecoration: "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.textDecoration =
            "underline")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")
        }
      >
        {url}
      </a>

      {/* Open in new tab */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Open in new tab"
        style={{
          color: "#555",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.color = "#aaa")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.color = "#555")
        }
        onMouseDown={(e) => e.stopPropagation()}
      >
        <ExternalLink size={10} />
      </a>

      {/* Copy */}
      <button
        onClick={copy}
        title="Copy URL"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: copied ? "#22c55e" : "#555",
          display: "flex",
          alignItems: "center",
          padding: 0,
          flexShrink: 0,
          transition: "color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!copied)
            (e.currentTarget as HTMLButtonElement).style.color = "#aaa";
        }}
        onMouseLeave={(e) => {
          if (!copied)
            (e.currentTarget as HTMLButtonElement).style.color = "#555";
        }}
      >
        <Copy size={10} />
      </button>
    </div>
  );
}

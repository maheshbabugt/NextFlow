/**
 * src/components/canvas/WorkflowCanvas.tsx
 *
 * Full-screen workflow canvas.
 *
 * Includes:
 *  ✅ ReactFlow canvas with dot-grid, pan/zoom, MiniMap, Controls
 *  ✅ "+" button (bottom center) → NodePickerPopup with all 6 node types
 *  ✅ Drag & Drop from external sidebar (dataTransfer)
 *  ✅ Click a node in the popup → adds it to canvas center
 *  ✅ Delete / Backspace → deletes selected nodes (undo-able)
 *  ✅ Ctrl+Z / Ctrl+Y → undo / redo
 *  ✅ Type-safe connections + DAG cycle detection
 *  ✅ Connected flags synced on edge add/remove
 *  ✅ History pushed before every destructive change
 */

"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  Plus,
  Type,
  Image,
  Video,
  Bot,
  Crop,
  Film,
  Search,
  X,
} from "lucide-react";

import { NODE_TYPES } from "./nodeTypes";
import { useWorkflowStore } from "@/store/workflowStore";
import { createNode } from "@/lib/nodeFactory";
import {
  wouldCreateCycle,
  isValidConnection,
  getSourceKind,
} from "@/lib/graphUtils";
import type { AnyFlowNode, NodeKind } from "@/types/nodes";

/* ─── Edge style ─────────────────────────────────────────────────────── */
const EDGE_DEFAULTS = {
  style: { stroke: "#8b5cf6", strokeWidth: 1.5 },
  animated: true,
};

/* ─── Node picker data ───────────────────────────────────────────────── */
const PICKER_NODES: {
  kind: NodeKind;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    kind: "text",
    label: "Text",
    desc: "Text input / prompt",
    icon: <Type size={16} />,
    color: "#3b82f6",
  },
  {
    kind: "image",
    label: "Upload Image",
    desc: "Image URL or file upload",
    icon: <Image size={16} />,
    color: "#8b5cf6",
  },
  {
    kind: "video",
    label: "Upload Video",
    desc: "Video URL or file upload",
    icon: <Video size={16} />,
    color: "#ec4899",
  },
  {
    kind: "llm",
    label: "Run LLM",
    desc: "OpenAI model",
    icon: <Bot size={16} />,
    color: "#22c55e",
  },
  {
    kind: "crop",
    label: "Crop Image",
    desc: "Crop image region (FFmpeg)",
    icon: <Crop size={16} />,
    color: "#f59e0b",
  },
  {
    kind: "extract",
    label: "Extract Frame",
    desc: "Extract video frame",
    icon: <Film size={16} />,
    color: "#06b6d4",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   Node Picker Popup
   ═══════════════════════════════════════════════════════════════════════ */

function NodePickerPopup({
  onAdd,
  onClose,
}: {
  onAdd: (kind: NodeKind) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = PICKER_NODES.filter(
    (n) =>
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.desc.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 100,
          background: "transparent",
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: "absolute",
          bottom: 72,
          left: 0,
          zIndex: 101,
          width: 340,
          background: "#141414",
          border: "1px solid #2a2a2a",
          borderRadius: 14,
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          overflow: "hidden",
          animation: "popIn 0.15s cubic-bezier(0.4,0,0.2,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px 10px",
            borderBottom: "1px solid #1e1e1e",
          }}
        >
          <Search size={13} color="#555" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "#e0e0e0",
              fontSize: 13,
              caretColor: "#8b5cf6",
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#444",
              display: "flex",
              padding: 2,
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#888")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#444")
            }
          >
            <X size={13} />
          </button>
        </div>

        {/* Section label */}
        <div style={{ padding: "8px 14px 4px" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#444",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}
          >
            Node Types
          </span>
        </div>

        {/* Node list */}
        <div style={{ padding: "0 8px 10px" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                color: "#444",
                fontSize: 12,
              }}
            >
              No nodes match "{search}"
            </div>
          ) : (
            filtered.map((n) => (
              <PickerRow
                key={n.kind}
                node={n}
                onAdd={() => {
                  onAdd(n.kind);
                  onClose();
                }}
              />
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            borderTop: "1px solid #1a1a1a",
            padding: "8px 14px",
            fontSize: 10,
            color: "#333",
            textAlign: "center",
          }}
        >
          Click to add · or drag nodes from the "+" button
        </div>
      </div>
    </>
  );
}

function PickerRow({
  node,
  onAdd,
}: {
  node: (typeof PICKER_NODES)[0];
  onAdd: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onAdd}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "9px 10px",
        borderRadius: 9,
        background: hov ? "#1e1e1e" : "transparent",
        border: `1px solid ${hov ? "#2a2a2a" : "transparent"}`,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s ease, border-color 0.1s ease",
      }}
    >
      {/* Icon box */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: `${node.color}18`,
          border: `1px solid ${node.color}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: node.color,
          flexShrink: 0,
        }}
      >
        {node.icon}
      </div>

      {/* Text */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#d0d0d0",
            marginBottom: 1,
          }}
        >
          {node.label}
        </div>
        <div style={{ fontSize: 11, color: "#555" }}>{node.desc}</div>
      </div>

      {/* Arrow */}
      <div style={{ marginLeft: "auto", fontSize: 16, color: "#333" }}>›</div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Canvas
   ═══════════════════════════════════════════════════════════════════════ */

export default function WorkflowCanvas() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    deleteNodes,
    updateNodeData,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWorkflowStore();

  const { getViewport } = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);


  const runWorkflow = async () => {
    try {
      // 1. Find LLM node
      const llmNode = nodes.find((n) => n.type === "llm");

      if (!llmNode) {
        alert("No LLM node found");
        return;
      }

      // 2. Find connected edge
      const edge = edges.find((e) => e.target === llmNode.id);

      if (!edge) {
        alert("No input connected to LLM");
        return;
      }

      // 3. Get source node (Text node)
      const sourceNode = nodes.find((n) => n.id === edge.source);

      const userMessage = sourceNode?.data?.text || "";

      // 4. Call API
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: llmNode.data.systemPrompt,
          userMessage,
        }),
      });

      const data = await res.json();

      // 5. Update LLM node output
      updateNodeData(llmNode.id, {
        output: data.output,
      });
    } catch (err) {
      console.error(err);
      alert("Execution failed");
    }
  };


  /* ── Keyboard shortcuts ────────────────────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
        return;
      }
      if (
        (e.key === "y" && (e.ctrlKey || e.metaKey)) ||
        (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)
      ) {
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const ids = nodes.filter((n) => n.selected).map((n) => n.id);
        if (ids.length) {
          e.preventDefault();
          deleteNodes(ids);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nodes, undo, redo, canUndo, canRedo, deleteNodes]);

  /* ── Node changes ─────────────────────────────────────────────── */
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const hasDragEnd = changes.some(
        (c) => c.type === "position" && !(c as { dragging?: boolean }).dragging,
      );
      if (hasDragEnd) pushHistory();
      setNodes(applyNodeChanges(changes, nodes) as AnyFlowNode[]);
    },
    [nodes, setNodes, pushHistory],
  );

  /* ── Edge changes ─────────────────────────────────────────────── */
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removals = changes.filter((c) => c.type === "remove");
      if (removals.length) {
        pushHistory();
        const removed = removals
          .map((c) => edges.find((e) => e.id === (c as { id: string }).id))
          .filter(Boolean) as Edge[];
        const nextEdges = applyEdgeChanges(changes, edges);
        setEdges(nextEdges);
        removed.forEach((e) =>
          syncFlag(e.target, e.targetHandle ?? null, nextEdges),
        );
        return;
      }
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges, pushHistory],
  );

  /* ── New connection ────────────────────────────────────────────── */
  const onConnect = useCallback(
    (conn: Connection) => {
      const { source, target, sourceHandle, targetHandle } = conn;
      if (!source || !target) return;

      if (wouldCreateCycle(edges, source, target)) {
        flashReject(source);
        return;
      }
      const sk = getSourceKind(nodes, source);
      if (!isValidConnection(sk, targetHandle)) {
        flashReject(source);
        return;
      }

      pushHistory();
      const newEdge: Edge = {
        ...conn,
        id: `e-${source}-${sourceHandle ?? "o"}-${target}-${targetHandle ?? "i"}-${Date.now()}`,
        ...EDGE_DEFAULTS,
      };
      const nextEdges = addEdge(newEdge, edges);
      setEdges(nextEdges);
      syncFlag(target, targetHandle ?? null, nextEdges);
    },
    [edges, nodes, setEdges, pushHistory],
  );

  /* ── Drag-over / drop from EditorSidebar (if used externally) ─── */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData("application/nextflow-node") as
        | NodeKind
        | "";
      if (!kind) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      const { x, y, zoom } = getViewport();
      const centerX = (e.clientX - bounds.left - x) / zoom;
      const centerY = (e.clientY - bounds.top - y) / zoom;
      addNode(createNode(kind, { x: centerX, y: centerY }));
    },
    [addNode, getViewport],
  );

  /* ── Add node at canvas center (from picker popup) ─────────────── */
  const addAtCenter = useCallback(
    (kind: NodeKind) => {
      const { x, y, zoom } = getViewport();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      const centerX = (width / 2 - x) / zoom;
      const centerY = (height / 2 - y) / zoom;
      // Offset slightly so multiple adds don't stack perfectly
      const offset = nodes.length * 30;
      addNode(
        createNode(kind, {
          x: centerX - 110 + offset,
          y: centerY - 80 + offset,
        }),
      );
    },
    [addNode, nodes.length, getViewport],
  );

  /* ── Helpers ──────────────────────────────────────────────────── */
  const syncFlag = (
    targetId: string,
    handleId: string | null,
    currentEdges: Edge[],
  ) => {
    if (!handleId) return;
    const connected = currentEdges.some(
      (e) => e.target === targetId && e.targetHandle === handleId,
    );
    const map: Record<string, string> = {
      system_prompt: "systemPromptConnected",
      user_message: "userMessageConnected",
      images: "imagesConnected",
      image_url: "imageUrlConnected",
      video_url: "videoUrlConnected",
    };
    const flag = map[handleId];
    if (flag) updateNodeData(targetId, { [flag]: connected });
  };

  const flashReject = (nodeId: string) => {
    const el = document.querySelector(
      `[data-id="${nodeId}"]`,
    ) as HTMLElement | null;
    if (!el) return;
    el.style.outline = "2px solid #ef4444";
    el.style.outlineOffset = "3px";
    setTimeout(() => {
      el.style.outline = "";
      el.style.outlineOffset = "";
    }, 600);
  };

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div
      ref={canvasRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        deleteKeyCode={null} // we handle delete ourselves
        colorMode="dark"
        defaultEdgeOptions={EDGE_DEFAULTS}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        snapToGrid
        snapGrid={[12, 12]}
        proOptions={{ hideAttribution: true }}
        style={{ background: "#0a0a0a" }}
        selectionOnDrag
        multiSelectionKeyCode="Shift"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#333"
        />

        <Controls
          style={{
            background: "#111",
            border: "1px solid #1e1e1e",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
            bottom: 70,
            left: 12,
          }}
        />

        <MiniMap
          style={{
            background: "#111",
            border: "1px solid #1e1e1e",
            borderRadius: 10,
            overflow: "hidden",
            bottom: 70,
            right: 12,
          }}
          nodeColor={(n) => {
            const m: Record<string, string> = {
              text: "#3b82f6",
              image: "#8b5cf6",
              video: "#ec4899",
              llm: "#22c55e",
              crop: "#f59e0b",
              extract: "#06b6d4",
            };
            return m[n.type ?? ""] ?? "#444";
          }}
          maskColor="rgba(0,0,0,0.65)"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* ── "+" Add Node Button — bottom left ───────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 16,
          zIndex: 102,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        {/* Node picker popup — opens upward */}
        {pickerOpen && (
          <NodePickerPopup
            onAdd={addAtCenter}
            onClose={() => setPickerOpen(false)}
          />
        )}

        {/* The "+" button itself */}
        <button
          onClick={() => setPickerOpen((v) => !v)}
          title="Add node"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: pickerOpen
              ? "linear-gradient(135deg,#8b5cf6,#6d28d9)"
              : "linear-gradient(135deg,#3b3b3b,#2a2a2a)",
            border: `1px solid ${pickerOpen ? "#7c3aed" : "#3a3a3a"}`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: pickerOpen
              ? "0 0 20px rgba(139,92,246,0.5)"
              : "0 2px 12px rgba(0,0,0,0.6)",
            transition: "all 0.2s ease",
            transform: pickerOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}
          onMouseEnter={(e) => {
            if (!pickerOpen) {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg,#8b5cf6,#6d28d9)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#7c3aed";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 16px rgba(139,92,246,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!pickerOpen) {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg,#3b3b3b,#2a2a2a)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#3a3a3a";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 2px 12px rgba(0,0,0,0.6)";
            }
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Empty state hint ──────────────────────────────────────── */}
      {nodes.length === 0 && !pickerOpen && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>⚡</div>
          <div
            style={{
              fontSize: 15,
              color: "#333",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Start building your workflow
          </div>
          <div style={{ fontSize: 12, color: "#2a2a2a", lineHeight: 1.6 }}>
            Click the <strong style={{ color: "#555" }}>+</strong> button below
            to add nodes
            <br />
            Connect handles to build data pipelines
          </div>
        </div>
      )}
    </div>
  );
}

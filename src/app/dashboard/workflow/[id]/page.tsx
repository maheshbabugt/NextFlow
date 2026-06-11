/**
 * src/app/dashboard/workflow/[id]/page.tsx
 *
 * Krea-style Node Editor — FULL SCREEN canvas.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────┐
 * │  TopBar  (48px) — logo · name · counters · run buttons  │
 * ├──────────────────────────────────────────────────────────┤
 * │                                                          │
 * │              WorkflowCanvas  (fills all)                 │
 * │                                                          │
 * │  [+] button bottom-left  →  NodePickerPopup             │
 * │  [←] back to dashboard   (top-left of top bar)          │
 * └──────────────────────────────────────────────────────────┘
 *
 * No separate left sidebar panel.
 * Nodes are added via the "+" popup OR by drag from the mini tray.
 */

"use client";

import { ReactFlowProvider } from "@xyflow/react";
import WorkflowCanvas from "@/components/canvas/WorkflowCanvas";
import NodeEditorTopBar from "@/components/canvas/NodeEditorTopBar";
import { Type, Image, Video, Bot, Crop, Film } from "lucide-react";
import type { NodeKind } from "@/types/nodes";

const SIDEBAR_NODES: { kind: NodeKind; label: string; icon: React.ReactNode; color: string }[] = [
  { kind: "text",    label: "Text",          icon: <Type size={16} />,  color: "#3b82f6" },
  { kind: "image",   label: "Upload Image",  icon: <Image size={16} />, color: "#8b5cf6" },
  { kind: "video",   label: "Upload Video",  icon: <Video size={16} />, color: "#ec4899" },
  { kind: "llm",     label: "Run LLM",       icon: <Bot size={16} />,   color: "#22c55e" },
  { kind: "crop",    label: "Crop Image",    icon: <Crop size={16} />,  color: "#f59e0b" },
  { kind: "extract", label: "Extract Frame", icon: <Film size={16} />,  color: "#06b6d4" },
];

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          background: "#0a0a0a",
        }}
      >
        <NodeEditorTopBar />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          {/* ── Left sidebar — 6 node type buttons ── */}
          <div
            style={{
              width: 56,
              flexShrink: 0,
              background: "#0f0f0f",
              borderRight: "1px solid #1e1e1e",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 12,
              gap: 4,
              zIndex: 10,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "#333",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Nodes
            </div>
            {SIDEBAR_NODES.map((n) => (
              <div
                key={n.kind}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/nextflow-node", n.kind);
                  e.dataTransfer.effectAllowed = "move";
                }}
                title={n.label}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${n.color}18`,
                  border: `1px solid ${n.color}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: n.color,
                  cursor: "grab",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = `${n.color}30`;
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${n.color}66`;
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = `${n.color}18`;
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${n.color}33`;
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                }}
              >
                {n.icon}
              </div>
            ))}
          </div>

          {/* ── Canvas fills remaining space ── */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0 }}>
            <WorkflowCanvas />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

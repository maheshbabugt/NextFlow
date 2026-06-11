"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { GitFork } from "lucide-react";

interface WorkflowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

/* ─── Mini workflow preview rendered as SVG ─── */
function WorkflowPreview({ nodes, edges }: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) {
  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
    );
  }

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs) - 20;
  const minY = Math.min(...ys) - 20;
  const maxX = Math.max(...xs) + 120;
  const maxY = Math.max(...ys) + 60;
  const vw = maxX - minX;
  const vh = maxY - minY;

  const nodeColors: Record<string, string> = {
    llm: "#8b5cf6",
    text: "#3b82f6",
    image: "#10b981",
    output: "#f59e0b",
    default: "#555",
  };

  return (
    <svg
      viewBox={`${minX} ${minY} ${vw} ${vh}`}
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {edges.map((edge) => {
        const src = nodes.find((n) => n.id === edge.source);
        const tgt = nodes.find((n) => n.id === edge.target);
        if (!src || !tgt) return null;
        const x1 = src.position.x + 50;
        const y1 = src.position.y + 18;
        const x2 = tgt.position.x;
        const y2 = tgt.position.y + 18;
        const cx = (x1 + x2) / 2;
        return (
          <path
            key={edge.id}
            d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
          />
        );
      })}
      {nodes.map((node) => {
        const color = nodeColors[node.type ?? "default"] ?? nodeColors.default;
        const label = (node.data?.label as string) ?? node.type ?? "node";
        return (
          <g key={node.id}>
            <rect
              x={node.position.x}
              y={node.position.y}
              width={100}
              height={36}
              rx={6}
              fill={color}
              fillOpacity={0.25}
              stroke={color}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            <text
              x={node.position.x + 50}
              y={node.position.y + 22}
              textAnchor="middle"
              fill="rgba(255,255,255,0.8)"
              fontSize={10}
              fontFamily="sans-serif"
            >
              {label.length > 12 ? label.slice(0, 12) + "…" : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Inline rename input ─── */
function RenameInput({
  workflowId,
  currentName,
  onDone,
}: {
  workflowId: string;
  currentName: string;
  onDone: (newName: string) => void;
}) {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = async () => {
    const trimmed = value.trim() || currentName;
    try {
      await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workflowId, name: trimmed }),
      });
    } catch {
      // best effort
    }
    onDone(trimmed);
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") onDone(currentName);
      }}
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 5,
        padding: "2px 6px",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        outline: "none",
        width: "100%",
      }}
    />
  );
}

export default function NodeEditorPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Projects");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; workflowId: string } | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleNewWorkflow = () => router.push("/dashboard/workflow/new");

  const handleOpen = (workflowId: string) => {
    router.push(`/dashboard/workflow/${workflowId}`);
    setContextMenu(null);
  };

  const handleRename = (workflowId: string) => {
    setContextMenu(null);
    setRenamingId(workflowId);
  };

  const handleRenameDone = (workflowId: string, newName: string) => {
    setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? { ...w, name: newName } : w)));
    setRenamingId(null);
  };

  const handleDuplicate = async (workflowId: string) => {
    setContextMenu(null);
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    try {
      await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${workflow.name} (Copy)`,
          nodes: workflow.nodes ?? [],
          edges: workflow.edges ?? [],
        }),
      });
      await fetchWorkflows();
    } catch (err) {
      console.error("Failed to duplicate:", err);
    }
  };

  const handleDelete = async (workflowId: string) => {
    setContextMenu(null);
    if (!confirm("Delete this workflow? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/workflows?id=${workflowId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (diffDays === 0) return "Edited today";
    if (diffDays === 1) return "Edited 1 day ago";
    return `Edited ${diffDays} days ago`;
  };

  const filtered = workflows.filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ background: "#0a0a0a", height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: isMobile ? "280px" : "350px", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", padding: isMobile ? "0 20px" : "0 40px" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/images/node_editor.png)", backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.35)" }} />
        <div style={{ position: "relative", zIndex: 10, maxWidth: isMobile ? "100%" : "450px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: isMobile ? 40 : 46, height: isMobile ? 40 : 46, borderRadius: 10, background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GitFork size={isMobile ? 18 : 21} color="#fff" strokeWidth={2.5} style={{ transform: "rotate(90deg)" }} />
            </div>
            <h1 style={{ fontSize: isMobile ? "22px" : "26px", fontWeight: "700", color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Node Editor</h1>
          </div>
          <p style={{ fontSize: isMobile ? "13px" : "14px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5", marginBottom: "24px", maxWidth: isMobile ? "100%" : "420px" }}>
            Nodes is the most powerful way to operate Krea. Connect every tool and model into complex automated pipelines.
          </p>
          <button
            onClick={handleNewWorkflow}
            style={{ padding: "11px 26px", background: "#fff", color: "#000", border: "none", borderRadius: "999px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            New Workflow <span style={{ fontSize: "16px" }}>→</span>
          </button>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div style={{ padding: isMobile ? "16px 16px" : "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "12px" : "0", flexShrink: 0, background: "#0a0a0a" }}>
        {!isMobile && (
          <div style={{ display: "flex", gap: "32px" }}>
            {["Projects", "Apps", "Examples", "Templates"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ background: "none", border: "none", color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: "600", cursor: "pointer", padding: "0 0 4px 0", borderBottom: activeTab === tab ? "2px solid #fff" : "2px solid transparent", transition: "all 0.2s ease" }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", width: isMobile ? "100%" : "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "8px 14px", minWidth: isMobile ? "100%" : "220px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: "14px", flex: 1 }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "20px 16px" : "40px", position: "relative" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "40px" }}>Loading workflows...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(auto-fill, minmax(150px, 1fr))" : "repeat(auto-fill, minmax(260px, 1fr))", gap: isMobile ? "16px" : "24px" }}>
            {/* New Workflow Card */}
            <div
              onClick={handleNewWorkflow}
              style={{ background: "rgba(255,255,255,0.02)", border: "2px dashed rgba(255,255,255,0.15)", borderRadius: "14px", aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
            >
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", color: "rgba(255,255,255,0.6)", fontWeight: "300" }}>+</div>
            </div>

            {/* Workflow Cards */}
            {filtered.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => handleOpen(workflow.id)}
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease", position: "relative" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                }}
              >
                {/* Preview */}
                <div style={{ aspectRatio: "16/10", overflow: "hidden", background: "#111", position: "relative" }}>
                  <WorkflowPreview nodes={workflow.nodes} edges={workflow.edges} />
                  {/* Three-dot menu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, workflowId: workflow.id });
                    }}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 6, padding: "6px 8px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                </div>

                {/* Info */}
                <div style={{ padding: "14px 16px" }}>
                  {renamingId === workflow.id ? (
                    <RenameInput workflowId={workflow.id} currentName={workflow.name} onDone={(name) => handleRenameDone(workflow.id, name)} />
                  ) : (
                    <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#fff", margin: "0 0 4px 0" }}>{workflow.name}</h3>
                  )}
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: 0 }}>{getTimeAgo(workflow.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            ref={contextMenuRef}
            style={{ position: isMobile ? "fixed" : "fixed", bottom: isMobile ? "0" : "auto", left: isMobile ? "0" : contextMenu.x, right: isMobile ? "0" : "auto", top: isMobile ? "auto" : contextMenu.y, background: isMobile ? "rgba(18,18,18,0.98)" : "rgba(18,18,18,0.97)", border: isMobile ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.1)", borderRadius: isMobile ? "16px 16px 0 0" : 12, padding: isMobile ? "16px 0" : "6px 0", zIndex: 1000, minWidth: isMobile ? "100%" : 160, boxShadow: isMobile ? "0 -12px 40px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}
          >
            {[
              { label: "Open", icon: "↗", action: () => handleOpen(contextMenu.workflowId) },
              { label: "Rename", icon: "✎", action: () => handleRename(contextMenu.workflowId) },
              { label: "Duplicate", icon: "⎘", action: () => handleDuplicate(contextMenu.workflowId) },
              { label: "Delete", icon: "🗑", action: () => handleDelete(contextMenu.workflowId), color: "#ef4444" },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                style={{ width: "100%", background: "none", border: "none", padding: isMobile ? "14px 16px" : "10px 16px", textAlign: "left", color: item.color || "#fff", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "background 0.15s ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

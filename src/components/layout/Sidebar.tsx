"use client";

/**
 * Sidebar.tsx
 * 🔥 Enhanced version of YOUR existing sidebar (NO breaking changes)
 *
 * Added:
 * - Hover search icon in Tools
 * - Glass search popup modal
 * - Minimal UI polish (no structure changes)
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeft,
  Search,
  Home,
  GitFork,
  Image as ImageIcon,
  Video,
  Wand2,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useRef, useEffect } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useDisplayName } from "@/hooks/useDisplayName";
import { useRouter } from "next/navigation";

const DUMMY_NAMES = ["aiexplorer", "promptwizard", "galaxyuser", "starvisitor", "aiwalker", "lunastar"];

function getFallbackName(userId: string | null | undefined, clerkName: string | null | undefined): string {
  if (clerkName) return clerkName;
  if (!userId) return "explorer";
  // Pick consistently based on userId
  const idx = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % DUMMY_NAMES.length;
  return DUMMY_NAMES[idx];
}

/* ================= NAV ITEMS ================= */

const TOP_NAV = [
  {
    label: "Home",
    href: "/dashboard",
    icon: (
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Home size={13} color="#000" strokeWidth={2.5} />
      </div>
    )
  },
  {
    label: "Train Lora",
    href: "/dashboard/train-lora",
    icon: (
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "#171717", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" width="14" height="14">
          <circle cx="12" cy="9" r="5" fill="#ef4444" style={{ mixBlendMode: 'screen' }} />
          <circle cx="8" cy="15" r="5" fill="#3b82f6" style={{ mixBlendMode: 'screen' }} />
          <circle cx="16" cy="15" r="5" fill="#22c55e" style={{ mixBlendMode: 'screen' }} />
        </svg>
      </div>
    )
  },
  {
    label: "Node Editor",
    href: "/dashboard/node-editor",
    icon: (
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GitFork size={13} color="#fff" strokeWidth={2.5} style={{ transform: 'rotate(90deg)' }} />
      </div>
    )
  },
  {
    label: "Gallery",
    href: "/dashboard/gallery",
    icon: (
      <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#38bdf8" />
        </svg>
      </div>
    )
  }
];

const TOOLS = [
  {
    label: "Image",
    href: "/dashboard/tools/image",
    icon: (
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ImageIcon size={12} color="#0ea5e9" strokeWidth={2.5} />
      </div>
    )
  },
  {
    label: "Video",
    href: "/dashboard/tools/video",
    icon: (
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #f59e0b, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Video size={12} color="#fff" strokeWidth={2.5} fill="#fff" />
      </div>
    )
  },
  {
    label: "Enhancer",
    href: "/dashboard/tools/enhancer",
    icon: (
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "#171717", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.05)" }}>
        <Wand2 size={11} color="#e0e0e0" />
      </div>
    )
  },
  {
    label: "Nano Banana",
    href: "/dashboard/tools/nano-banana",
    icon: (
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "#facc15", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, lineHeight: 1 }}>🍌</span>
      </div>
    )
  },
  {
    label: "Realtime",
    href: "/dashboard/tools/realtime",
    icon: (
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      </div>
    )
  },
  {
    label: "Edit",
    href: "/dashboard/tools/edit",
    icon: (
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
    )
  }
];

/* ================= COMPONENT ================= */

export default function Sidebar({ onAuthRequired }: { onAuthRequired?: () => void }) {
  const { sidebarExpanded, toggleSidebar } = useUIStore();
  const pathname = usePathname();
  const { userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { displayName } = useDisplayName();

  // Use DB name → Clerk name → fun dummy name (consistent per user)
  const clerkName = user?.firstName ?? user?.username ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? null;
  const shownName = displayName || clerkName || getFallbackName(userId, null);

  const [toolsOpen, setToolsOpen] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // 🔥 NEW: search modal state
  const [openSearchModal, setOpenSearchModal] = useState(false);

  const W = sidebarExpanded ? 240 : 60;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setOpenUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  /* ================= FILTER LOGIC ================= */

  const filteredTools = searchVal
    ? TOOLS.filter((t) =>
        t.label.toLowerCase().includes(searchVal.toLowerCase()),
      )
    : TOOLS;

  return (
    <>
      {/* ================= SIDEBAR ================= */}
      <aside
        style={{
          width: W,
          minWidth: W,
          height: "100vh",
          background: "var(--sidebar-bg)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "visible",
          transition:
            "width 280ms cubic-bezier(0.4,0,0.2,1), min-width 280ms cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        {/* ================= HEADER ================= */}
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarExpanded ? "space-between" : "center",
            padding: sidebarExpanded ? "0 8px 0 12px" : "0 8px",
            borderBottom: "none",
          }}
        >
          {sidebarExpanded && (
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {/* Logo */}
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  src="/icon.png"
                  alt="NextFlow logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#f0f0f0",
                  letterSpacing: "-0.02em",
                }}
              >
                NextFlow
              </span>
            </div>
          )}

          {/* Collapse Button */}
          <SbBtn onClick={toggleSidebar}>
            {sidebarExpanded ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeft size={20} />
            )}
          </SbBtn>
        </div>
        <div style={{ padding: "18px 8px 8px" }}></div>
        {/* ================= SEARCH INPUT ================= */}
        {/* <div style={{ padding: "10px 8px 4px" }}>
          {sidebarExpanded ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#1a1a1a",
                border: "1px solid #282828",
                borderRadius: 8,
                padding: "6px 10px",
              }}
            >
              <Search size={12} color="#555" />

              <input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search tools..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#e0e0e0",
                  fontSize: 12,
                  width: "100%",
                }}
              />
            </div>
          ) : (
            <SbBtn>
              <Search size={14} />
            </SbBtn>
          )}
        </div>
 */}
        {/* ================= NAV ================= */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 6px" }}>
          {/* TOP NAV */}
          {TOP_NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              expanded={sidebarExpanded}
              onClick={(e: React.MouseEvent) => {
                if (!userId && item.href !== "/dashboard") {
                  e.preventDefault();
                  onAuthRequired?.();
                }
              }}
            />
          ))}

          {/* <Divider /> */}

          {/* ================= TOOLS HEADER ================= */}
          {sidebarExpanded ? (
            <div
              className="tools-header sidebar-item"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 8px 8px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#6b7280",
                  letterSpacing: "-0.01em",
                }}
              >
                Tools
              </span>

              {/* 🔥 Hover search icon */}
              <div className="search-icon-wrapper">
                <Search size={12} onClick={() => {
                  if (!userId) {
                    onAuthRequired?.();
                  } else {
                    setOpenSearchModal(true);
                  }
                }} />
              </div>
            </div>
          ) : (
            <div style={{ height: 8 }} />
          )}

          {/* ================= TOOLS LIST ================= */}
          {(toolsOpen || !sidebarExpanded) &&
            filteredTools.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={
                  pathname === item.href || pathname.startsWith(item.href + "/")
                }
                expanded={sidebarExpanded}
                showDot={(item as any).dot}
                onClick={(e: React.MouseEvent) => {
                  if (!userId && item.href !== "/dashboard") {
                    e.preventDefault();
                    onAuthRequired?.();
                  }
                }}
              />
            ))}
        </nav>

        {/* ================= BOTTOM ================= */}
        {/* <div style={{ padding: "8px 6px 10px"}}>
          <button className="upgrade-btn">Upgrade</button>
        </div> */}
        {/* ── Bottom ── */}
        <div
          style={{
            padding: "12px 8px",
            flexShrink: 0,
            position: "relative",
          }}
        >
         

          {/* Upgrade button - Hidden on mobile */}
          <Link 
            href="/dashboard/pricing" 
            className="upgrade-big upgrade-btn-responsive" 
            style={{ 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              boxSizing: "border-box",
              gap: sidebarExpanded ? "8px" : "0",
            }}
            onClick={(e) => {
              if (!userId) {
                e.preventDefault();
                onAuthRequired?.();
              }
            }}
          >
            <span style={{ fontSize: "18px" }}>💰</span>
            {sidebarExpanded && <span>Upgrade</span>}
          </Link>

          {/* User card */}
          <div className="user-card" onClick={() => {
            if (!userId) {
              onAuthRequired?.();
            } else {
              setOpenUserMenu((v) => !v);
            }
          }}>
            <div className="user-left">
              <div className="avatar">{shownName[0].toUpperCase()}</div>

              {sidebarExpanded && (
                <div>
                  <div className="username">{shownName}</div>
                  <div className="plan">Free</div>
                </div>
              )}
            </div>

            <div className="user-arrow">⌃</div>
          </div>

          {/* Popup */}
          {openUserMenu && (
            <div ref={userMenuRef} className="user-popup">
              <div
                className="popup-item"
                onClick={() => { setOpenUserMenu(false); router.push("/dashboard/pricing"); }}
              >
                Buy Credits
              </div>
              <div
                className="popup-item"
                style={{ color: "#ef4444" }}
                onClick={() => signOut(() => router.push("/"))}
              >
                Log out
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ================= 🔥 SEARCH MODAL ================= */}
      {openSearchModal && (
        <div
          className="search-overlay"
          onClick={() => setOpenSearchModal(false)}
        >
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            {/* INPUT */}
            <div className="search-input">
              <Search size={14} />
              <input
                placeholder="Search tools..."
                autoFocus
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>

            {/* RESULTS */}
            <div className="search-results" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredTools.map((item) => (
                <div key={item.href} className="search-item" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ transform: "scale(0.8)", transformOrigin: "left center" }}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================= HELPERS ================= */

function SbBtn({ children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 64,
        height: 64,
        borderRadius: 10,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "#777",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

function NavLink({ href, icon, label, active, expanded, showDot, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`sidebar-item ${active ? "sidebar-active" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: expanded ? "6px 10px" : "10px 0",
        fontSize: 14,
        fontWeight: active ? 500 : 500,
        justifyContent: expanded ? "flex-start" : "center",
        borderRadius: 8,
        marginBottom: 4,
        textDecoration: "none",
        color: active ? "#fff" : "#a1a1aa",
        background: active ? "#2e2e2e" : "transparent",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      {expanded && <span style={{ flex: 1, letterSpacing: "-0.01em" }}>{label}</span>}
      {showDot && expanded && (
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", marginLeft: "auto", marginRight: 4 }} />
      )}
    </Link>
  );
}

function Divider() {
  return (
    <div style={{ height: 1, background: "#1e1e1e", margin: "14px 6px" }} />
  );
}

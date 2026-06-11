"use client";

// Image Generation Tool Page
// Main interface for generating images with AI
// Two states: landing (intro cards) and results (generated images grid)
// Features: prompt input, toolbar options (model, style, ratio, quality), image preview
// Mobile responsive: stacked layout on mobile, side-by-side on desktop
// Key: ResultCard component handles hover actions (upscale, vary, edit, video, download)

import { useState, useRef, useEffect } from "react";
import {
  ImageIcon,
  Plus,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Download,
  RefreshCw,
  Wand2,
  Pencil,
  Video,
  RotateCcw,
  Trash2,
} from "lucide-react";

/* ─── Intro cards (landing state) ───────────────────────────────── */
// Sample cards shown before user generates first image
// Fanned layout on desktop, stacked on mobile
const INTRO_CARDS = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&q=80",
    label: "A Highly Stylize...",
    full: "A highly stylized animated 3D scene of a realistic cat with a hat in a street characterizing san francisco. 3D pixar style. vivid colors. detailed realism. whimsical mood.",
    rotate: "-6deg",
    zIndex: 1,
    offsetY: "0px",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80",
    label: "A Young Woma...",
    full: "A young woman in Renaissance-style oil painting. dramatic lighting. rich warm tones. classical portrait composition. detailed fabric texture.",
    rotate: "-2deg",
    zIndex: 2,
    offsetY: "40px",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1615361200141-f45040f367be?w=800&q=80",
    label: "Different Piece...",
    full: "Different pieces of fresh sushi on a clean pastel background. food photography. studio lighting. vibrant colors. minimal composition.",
    rotate: "6deg",
    zIndex: 1,
    offsetY: "-20px",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80",
    label: "A Surreal, Drea...",
    full: "A surreal dreamscape with a glowing figure reaching toward a cosmic hand. ethereal light. deep space background. cinematic atmosphere.",
    rotate: "2deg",
    zIndex: 1,
    offsetY: "10px",
  },
];

/* ─── Mock generated results (4 variants) ───────────────────────── */
const RESULT_IMAGES = [
  "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=85",
  "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&q=85",
  "https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&q=85",
  "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=800&q=85",
];

/* ─── Toolbar items ──────────────────────────────────────────────── */
const TOOLBAR_ITEMS = [
  { id: "krea", label: "Krea 1", icon: "✦" },
  { id: "lora", label: "Lora", icon: "◎" },
  { id: "image-prompt", label: "Image prompt", icon: "🖼", hasCount: true },
  { id: "style", label: "Style transfer", icon: "◈" },
  { id: "ratio", label: "1:1", icon: "▭" },
  { id: "quality", label: "1.5K", icon: "◇" },
];

/* ═══════════════════════════════════════════════════════════════════
   Result image card with hover actions
   ═══════════════════════════════════════════════════════════════════ */
function ResultCard({ src, isFirst }: { src: string; isFirst: boolean }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        aspectRatio: "1 / 1",
        background: "#111",
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt="generated"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 0.3s ease",
          transform: hov ? "scale(1.03)" : "scale(1)",
        }}
      />

      {/* hover overlay */}
      {hov && (
        <>
          {/* top-left: like/dislike (only first card shows full actions) */}
          {isFirst && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                display: "flex",
                gap: 6,
                zIndex: 2,
              }}
            >
              {[Heart, ThumbsUp, ThumbsDown].map((Icon, i) => (
                <button
                  key={i}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ccc",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <Icon size={13} />
                </button>
              ))}
            </div>
          )}

          {/* bottom action bar (first card only) */}
          {isFirst && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "10px 12px",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 14px",
                zIndex: 2,
              }}
            >
              {[
                { icon: Wand2, label: "Upscale" },
                { icon: RefreshCw, label: "Vary" },
                { icon: Pencil, label: "Edit" },
                { icon: Video, label: "Video" },
                { icon: Download, label: "Download" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "none",
                    border: "none",
                    color: "#ddd",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* dim overlay for non-first cards */}
          {!isFirst && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.15)",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════════════════ */
export default function ImagePage() {
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [hasResults, setHasResults] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [imagePromptOpen, setImagePromptOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const imagePromptBtnRef = useRef<HTMLButtonElement>(null);

  /* detect mobile on mount and resize */
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* close image-prompt popup on outside click */
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        imagePromptBtnRef.current &&
        !imagePromptBtnRef.current.contains(e.target as Node)
      ) {
        setImagePromptOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function handleGenerate() {
    if (!prompt.trim()) return;
    setSubmittedPrompt(prompt);
    setHasResults(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#101010",
        overflow: isMobile ? "auto" : "hidden",
        position: "relative",
        paddingTop: isMobile ? "60px" : "0",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════
          RESULTS VIEW
          ══════════════════════════════════════════════════════════════ */}
      {hasResults ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            overflow: "hidden",
            paddingBottom: 120,
          }}
        >
          {/* ── Left panel: prompt card ─────────────────────────── */}
          <div
            style={{
              width: isMobile ? "100%" : 220,
              flexShrink: 0,
              padding: isMobile ? "16px 16px 0" : "24px 16px",
              display: isMobile ? "none" : "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Prompt card */}
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "#e0e0e0",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {submittedPrompt}
              </p>
            </div>

            {/* Thumbnail + meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "#222",
                }}
              >
                <img
                  src={RESULT_IMAGES[0]}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: "#888",
                    background: "#1e1e1e",
                    border: "1px solid #2a2a2a",
                    borderRadius: 6,
                    padding: "2px 8px",
                  }}
                >
                  1.5K
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#888",
                    background: "#1e1e1e",
                    border: "1px solid #2a2a2a",
                    borderRadius: 6,
                    padding: "2px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  ✦ Krea 1
                </span>
              </div>
            </div>
          </div>

          {/* ── Right panel: image grid ─────────────────────────── */}
          <div
            style={{
              flex: 1,
              padding: isMobile ? "16px 16px 0" : "24px 24px 0",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              overflow: "hidden",
            }}
          >
            {/* Image grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                gap: isMobile ? 6 : 8,
                flex: 1,
                maxHeight: "calc(100vh - 220px)",
              }}
            >
              {RESULT_IMAGES.map((src, i) => (
                <ResultCard key={i} src={src} isFirst={i === 0} />
              ))}
            </div>

            {/* Bottom row actions */}
            <div
              style={{
                display: "flex",
                justifyContent: isMobile ? "center" : "flex-end",
                gap: isMobile ? 8 : 16,
                paddingBottom: 8,
                flexWrap: "wrap",
              }}
            >
              {[
                { icon: RotateCcw, label: "Retry" },
                { icon: RefreshCw, label: "Reuse parameters" },
                { icon: Download, label: "Download all" },
                { icon: Trash2, label: "Delete" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "none",
                    border: "none",
                    color: "#555",
                    fontSize: isMobile ? 11 : 12,
                    cursor: "pointer",
                    padding: 0,
                    transition: "color 0.12s ease",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "#ccc")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "#555")
                  }
                >
                  <Icon size={isMobile ? 11 : 12} />
                  {!isMobile && label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════
            LANDING VIEW — centered cards
            ══════════════════════════════════════════════════════════════ */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: isMobile ? 140 : 140,
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 10 : 14,
              marginBottom: isMobile ? 32 : 52,
            }}
          >
            <div
              style={{
                width: isMobile ? 40 : 52,
                height: isMobile ? 40 : 52,
                borderRadius: 14,
                background: "linear-gradient(135deg,#38bdf8,#3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
              }}
            >
              <ImageIcon size={isMobile ? 20 : 26} color="#fff" />
            </div>
            <span
              style={{
                fontSize: isMobile ? 32 : 48,
                fontWeight: 700,
                color: "#f5f5f5",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              Image
            </span>
          </div>

          {/* Fanned cards */}
          <div
            style={{
              display: "flex",
              alignItems: isMobile ? "center" : "flex-end",
              justifyContent: "center",
              position: "relative",
              height: isMobile ? "auto" : 320,
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 12 : 0,
            }}
          >
            {INTRO_CARDS.map((card, i) => {
              const isHovered = hoveredCard === card.id;
              return (
                <div
                  key={card.id}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    position: "relative",
                    width: isMobile ? "100%" : 200,
                    maxWidth: isMobile ? 280 : 200,
                    height: isMobile ? 200 : 260,
                    borderRadius: 18,
                    overflow: "hidden",
                    flexShrink: 0,
                    marginLeft: isMobile ? 0 : i === 0 ? 0 : -28,
                    transform: isMobile
                      ? "none"
                      : `rotate(${card.rotate}) translateY(${isHovered ? "-18px" : card.offsetY})`,
                    zIndex: isHovered ? 10 : card.zIndex,
                    transition:
                      "transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease",
                    boxShadow: isHovered
                      ? "0 24px 60px rgba(0,0,0,0.8)"
                      : "0 8px 32px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={card.src}
                    alt={card.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transform: isHovered ? "scale(1.04)" : "scale(1)",
                      transition: "transform 0.35s ease",
                    }}
                  />
                  {/* gradient */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
                    }}
                  />
                  {/* short label (idle) */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 14,
                      left: 14,
                      right: 14,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      opacity: isHovered ? 0 : 1,
                      transition: "opacity 0.18s ease",
                    }}
                  >
                    {card.label}
                  </div>
                  {/* full prompt (hover) */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "14px 14px 16px",
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 70%, transparent 100%)",
                      fontSize: 11,
                      color: "#e0e0e0",
                      lineHeight: 1.5,
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered
                        ? "translateY(0)"
                        : "translateY(6px)",
                      transition: "opacity 0.2s ease, transform 0.2s ease",
                    }}
                  >
                    {card.full}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PROMPT BAR — always visible at bottom
          ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: isMobile ? "fixed" : "absolute",
          bottom: isMobile ? 20 : 28,
          left: "50%",
          transform: "translateX(-50%)",
          width: isMobile ? "calc(100% - 24px)" : "min(640px, calc(100% - 48px))",
          zIndex: 20,
        }}
      >
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2e2e2e",
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Input row */}
          <div
            style={{
              padding: isMobile ? "12px 48px 8px 14px" : "14px 56px 10px 16px",
              position: "relative",
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe an image and click generate..."
              rows={prompt.length > 80 ? 3 : 1}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                outline: "none",
                color: "#e0e0e0",
                fontSize: isMobile ? 13 : 14,
                lineHeight: 1.5,
                resize: "none",
                fontFamily: "inherit",
                caretColor: "#ffffff",
              }}
            />
            {/* Right icons */}
            <div
              style={{
                position: "absolute",
                right: 14,
                top: 14,
                display: "flex",
                gap: 6,
              }}
            >
              
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                ✦
              </div>
            </div>
          </div>

          {/* Toolbar row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: isMobile ? "6px 8px 8px" : "6px 12px 10px",
              gap: isMobile ? 1 : 2,
              borderTop: "1px solid #252525",
              flexWrap: "wrap",
              overflow: isMobile ? "auto" : "visible",
            }}
          >
            {TOOLBAR_ITEMS.map((item) => {
              const isActive = activeItem === item.id;
              const isImgPrompt = item.id === "image-prompt";
              const isOpen = isImgPrompt && imagePromptOpen;
              return (
                <button
                  key={item.id}
                  ref={isImgPrompt ? imagePromptBtnRef : undefined}
                  onClick={() => {
                    if (isImgPrompt) {
                      setImagePromptOpen((v) => !v);
                    } else {
                      setActiveItem(isActive ? null : item.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: isMobile ? "4px 8px" : "5px 10px",
                    borderRadius: 8,
                    background:
                      isActive || isOpen
                        ? "rgba(255,255,255,0.1)"
                        : "transparent",
                    border: "1px solid transparent",
                    color: isActive || isOpen ? "#e0e0e0" : "#666",
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#d0d0d0";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      isActive || isOpen ? "#e0e0e0" : "#666";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      isActive || isOpen
                        ? "rgba(255,255,255,0.1)"
                        : "transparent";
                  }}
                >
                  <span style={{ fontSize: 11 }}>{item.icon}</span>
                  {item.label}
                  {item.hasCount && isActive && (
                    <span
                      style={{
                        fontSize: 10,
                        background: "#333",
                        borderRadius: 4,
                        padding: "1px 5px",
                        color: "#aaa",
                      }}
                    >
                      1/2
                    </span>
                  )}
                </button>
              );
            })}

            <div style={{ flex: 1 }} />

            {/* Generate "+" button */}
            <button
              onClick={handleGenerate}
              style={{
                width: isMobile ? 30 : 34,
                height: isMobile ? 30 : 34,
                borderRadius: "50%",
                background: prompt.trim()
                  ? "linear-gradient(135deg,#3b82f6,#8b5cf6)"
                  : "#222",
                border: "none",
                cursor: prompt.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: prompt.trim()
                  ? "0 2px 12px rgba(139,92,246,0.4)"
                  : "none",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <Plus
                size={isMobile ? 16 : 18}
                color={prompt.trim() ? "#fff" : "#444"}
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>

        {/* Image prompt popup */}
        {imagePromptOpen && (
          <div
            ref={popupRef}
            style={{
              position: "absolute",
              bottom: isMobile ? "calc(100% + 8px)" : "calc(100% + 10px)",
              left: isMobile ? 0 : 0,
              width: isMobile ? "100%" : 300,
              background: "#1e1e1e",
              border: "1px solid #2e2e2e",
              borderRadius: 14,
              padding: isMobile ? "16px 16px 12px" : "20px 20px 14px",
              boxShadow: "0 16px 50px rgba(0,0,0,0.7)",
              zIndex: 50,
            }}
          >
            <p
              style={{
                fontSize: isMobile ? 12 : 13,
                color: "#aaa",
                lineHeight: 1.65,
                textAlign: "center",
                marginBottom: 18,
              }}
            >
              Image prompts apply the style and content of any picture to your
              generation. Upload images or select from your asset library
            </p>
            <button
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 50,
                background: "#fff",
                border: "none",
                color: "#111",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                marginBottom: 6,
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Upload
            </button>
            <button
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 10,
                background: "transparent",
                border: "none",
                color: "#888",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#e0e0e0")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#888")
              }
            >
              <span>🖼</span>
              Select asset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

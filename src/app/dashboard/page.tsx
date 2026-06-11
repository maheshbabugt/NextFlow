"use client";

// Dashboard Home Page
// Main hub showing all available AI models (image, video, nodes, apps)
// Features carousels for browsing models, release notes, and action cards
// Displays trending models, new releases, and quick action buttons
// Key features: search, filtering by tags, responsive carousels, mobile-optimized

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Zap,
  Star,
  Play,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Video,
  Wand2,
  PenTool,
  Globe,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */
type Tag = "Featured" | "New" | "Free";

interface ModelCard {
  id: number;
  name: string;
  desc: string;
  tags: Tag[];
  cost: string;
  speed: number;
  quality: number;
  thumb: string;
}

interface VideoModel extends ModelCard {
  videoUrl: string;
}

/* ─── Data ──────────────────────────────────────────────────────── */
const IMAGE_MODELS: ModelCard[] = [
  {
    id: 1,
    name: "Nano Banana 2",
    desc: "Google's latest flash image model (Gemini 3.1 Flash Image) optimised for fast generation with support for unlimited context.",
    tags: ["Featured", "New"],
    cost: "~50",
    speed: 3,
    quality: 3,
    thumb: "/images/6.png",
  },
  {
    id: 2,
    name: "Nano Banana Pro",
    desc: "Smartest model. World's best prompt adherence. Best for complex tasks and image editing.",
    tags: ["Featured"],
    cost: "~100",
    speed: 3,
    quality: 3,
    thumb: "/images/2.png",
  },
  {
    id: 3,
    name: "PixelForge",
    desc: "Fast and consistent image generation with solid detail.",
    tags: ["Free"],
    cost: "5",
    speed: 3,
    quality: 2,
    thumb: "/images/7.png",
  },
  {
    id: 4,
    name: "Z Image",
    desc: "Cheapest model. Medium quality photorealism at a budget. Realistic textures, weak diversity.",
    tags: ["Free", "New"],
    cost: "3",
    speed: 3,
    quality: 2,
    thumb: "/images/3.png",
  },
  {
    id: 5,
    name: "Stellar XL",
    desc: "High-fidelity photorealism with exceptional detail retention and color accuracy.",
    tags: ["New"],
    cost: "~80",
    speed: 2,
    quality: 3,
    thumb: "/images/4.png",
  },
  {
    id: 6,
    name: "DreamFusion",
    desc: "Creative AI with surreal outputs and artistic flexibility.",
    tags: ["New"],
    cost: "~60",
    speed: 2,
    quality: 3,
    thumb: "/images/5.png",
  },

  {
    id: 7,
    name: "VisionCraft",
    desc: "Balanced model for production-ready visuals.",
    tags: ["Featured"],
    cost: "~90",
    speed: 2,
    quality: 3,
    thumb: "/images/hero1.png",
  },
];

const VIDEO_MODELS: VideoModel[] = [
  {
    id: 1,
    name: "Kling 2.6",
    desc: "Frontier model from Kling with native audio. Highest quality at a moderate price point.",
    tags: ["Featured"],
    cost: "~300",
    speed: 3,
    quality: 3,
    videoUrl: "/videos/vid_2.mp4",
    thumb: "/images/thumb_2.png",
  },
  {
    id: 2,
    name: "Grok Imagine",
    desc: "Fast, high-quality video generation by xAI.",
    tags: ["New"],
    cost: "~250",
    speed: 3,
    quality: 2,
    videoUrl: "/videos/vid_4.mp4",
    thumb: "/images/thumb_4.png",
  },
  {
    id: 3,
    name: "Vidu Q3",
    desc: "New model excelling at anime.",
    tags: ["New"],
    cost: "~600",
    speed: 3,
    quality: 2,
    videoUrl: "/videos/vid_3.mp4",
    thumb: "/images/thumb_3.png",
  },
  {
    id: 4,
    name: "CinemaFlow",
    desc: "Cinematic quality generation with realistic motion and lighting.",
    tags: ["Featured"],
    cost: "~400",
    speed: 2,
    quality: 3,
    videoUrl: "/videos/vid_1.webm",
    thumb: "/images/thumb_1.png",
  },
  {
    id: 5,
    name: "MotionX",
    desc: "Ultra-smooth motion generation with cinematic output.",
    tags: ["New"],
    cost: "~350",
    speed: 3,
    quality: 3,
    videoUrl: "/videos/vid_5.mp4",
    thumb: "/images/thumb_5.png",
  },
  {
    id: 6,
    name: "MotionX",
    desc: "Ultra-smooth motion generation with cinematic output.",
    tags: ["New"],
    cost: "~350",
    speed: 3,
    quality: 3,
    videoUrl: "/videos/vid_6.mp4",
    thumb: "/images/thumb_6.png",
  },
  {
    id: 7,
    name: "MotionX",
    desc: "Ultra-smooth motion generation with cinematic output.",
    tags: ["New"],
    cost: "~350",
    speed: 3,
    quality: 3,
    videoUrl: "/videos/vid_7.mp4",
    thumb: "/images/thumb_7.png",
  },
];

const NODE_APPS = [
  {
    id: 1,
    name: "CCTV Selfies",
    desc: "Put your face and outfit into a convincing collection of surveillance footage.",
    thumb: "/images/0_node.png",
  },
  {
    id: 2,
    name: "Animorph yourself",
    desc: "How would you look morphing into a raccoon? An alien? Anything.",
    thumb: "/images/1_node.png",
  },
  {
    id: 3,
    name: "Digicam Snapshots",
    desc: "Show your best outfits on a 2000s digicam. Perfect nostalgic aesthetic.",
    thumb: "/images/2_node.png",
  },
  {
    id: 4,
    name: "Billboard Magic",
    desc: "Transform your product into a breathtaking city billboard that grabs eyes and spreads everywhere instantly.",
    thumb: "/images/3_node.jpg",
  },
];

const RELEASE_NOTES = [
  {
    id: 1,
    title: "Visual Workflow Canvas (React Flow)",
    desc: "Built a pixel-perfect node-based workflow builder with drag-and-drop, zoom, pan, and minimap support for seamless pipeline creation.",
    date: "Mar 26, 2026",
    thumb: "/images/real_work/image.png",
  },
  {
    id: 2,
    title: "Graph-Based Execution Engine",
    desc: "Implemented a DAG-based execution system where nodes run based on dependencies, enabling correct data flow and parallel execution.",
    date: "Mar 27, 2026",
    thumb: "/images/real_work/image copy.png",
  },
  {
    id: 3,
    title: "LLM + Media Processing Integration",
    desc: "Integrated Google Gemini via Trigger.dev with support for text, image inputs, and media processing using FFmpeg tasks for crop and frame extraction.",
    date: "Mar 28, 2026",
    thumb: "/images/real_work/image copy 2.png",
  },
  {
    id: 4,
    title: "Workflow History & Persistence",
    desc: "Added execution history with node-level logs, statuses, and timestamps, persisted using PostgreSQL with Prisma ORM.",
    date: "Mar 30, 2026",
    thumb: "/images/real_work/image copy 3.png",
  },
];

const ACTIONS = [
  {
    id: 1,
    name: "AI Image Generator – Qwen",
    desc: "Free Qwen AI image generator.",
    thumb: "/images/instant/image.png",
  },
  {
    id: 2,
    name: "AI Image Generator – Wan 2.2",
    desc: "Make ultra-realistic images with the new Wan 2.2 model.",
    thumb: "/images/instant/image copy.png",
  },
  {
    id: 3,
    name: "AI T-Shirt Design Generator",
    desc: "Create custom T-shirt designs with AI for print on demand.",
    thumb: "/images/instant/image copy 2.png",
  },
  {
    id: 4,
    name: "AI Portrait Studio",
    desc: "Professional portrait generation with studio-quality lighting.",
    thumb: "/images/instant/image copy 3.png",
  },
];

const FOOTER_LINKS = [
  {
    title: "NextFlow",
    links: [
      "Log In",
      "Pricing",
      "Plans",
      "NextFlow Teams",
      "NextFlow Enterprise",
      "Gallery",
      "NextFlow for Architecture",
    ],
  },
  {
    title: "Products",
    links: [
      "Image",
      "Video",
      "Enhancer",
      "Realtime",
      "Edit",
      "Chat",
      "Stage",
      "Animator",
      "Train",
    ],
  },
  {
    title: "Resources",
    links: [
      "Pricing",
      "Careers",
      "Terms of Service",
      "Privacy Policy",
      "Documentation",
      "Models",
    ],
  },
  {
    title: "About",
    links: ["Blog", "Discord", "Articles"],
  },
];

const QUICK_TOOLS = [
  { label: "Generate Image", icon: "🖼️", href: "/dashboard/tools/image" },
  { label: "Generate Video", icon: "🎬", href: "/dashboard/tools/video" },
  { label: "Upscale & Enhance", icon: "✨", href: "/dashboard/tools/image" },
  { label: "Realtime", icon: "⚡", href: "/dashboard/tools/image" },
];

/* ─── Tiny helpers ──────────────────────────────────────────────── */

function Dots({
  count,
  max = 3,
  diamond = false,
}: {
  count: number;
  max?: number;
  diamond?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: diamond ? 7 : 6,
            height: diamond ? 7 : 6,
            transform: diamond ? "rotate(45deg)" : undefined,
            borderRadius: diamond ? 0 : "50%",
            background:
              i < count ? (diamond ? "#a78bfa" : "#d0d0d0") : "#2a2a2a",
          }}
        />
      ))}
    </div>
  );
}

function TagBadge({ label }: { label: Tag }) {
  const cfg: Record<Tag, { bg: string; color: string; border: string }> = {
    Featured: {
      bg: "rgba(139,92,246,0.18)",
      color: "#a78bfa",
      border: "rgba(139,92,246,0.25)",
    },
    Free: {
      bg: "rgba(34,197,94,0.15)",
      color: "#4ade80",
      border: "rgba(34,197,94,0.25)",
    },
    New: {
      bg: "rgba(255,255,255,0.08)",
      color: "#a0a0a0",
      border: "rgba(255,255,255,0.1)",
    },
  };
  const s = cfg[label];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 4,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        lineHeight: 1.4,
      }}
    >
      {label === "Featured" && <Star size={8} fill="currentColor" />}
      {label}
    </span>
  );
}

function CardOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
        pointerEvents: "none",
      }}
    />
  );
}

function TryBtn({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        right: 12,
        padding: "5px 14px",
        borderRadius: 20,
        background: "#fff",
        color: "#111",
        fontSize: 12,
        fontWeight: 600,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(5px)",
        transition: "opacity 0.18s ease, transform 0.18s ease",
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      Try it
    </div>
  );
}

/* ─── Carousel wrapper ──────────────────────────────────────────── */
// Reusable carousel component for displaying model cards
// Handles horizontal scrolling with prev/next buttons
// Loops back to start when reaching end (circular scrolling)
// Responsive: adjusts card width based on viewport

function Carousel({
  title,
  searchable,
  children,
}: {
  title: string;
  searchable?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const CARD_WIDTH = 332; // 320 + 12 gap

  // Scroll carousel left or right with smooth animation
  // Wraps around: right at end goes to start, left at start goes to end
  const scroll = (dir: "l" | "r") => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;

    if (dir === "r") {
      if (scrollLeft + clientWidth >= scrollWidth - 1) {
        ref.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        ref.current.scrollBy({ left: CARD_WIDTH, behavior: "smooth" });
      }
    } else {
      if (scrollLeft <= 0) {
        ref.current.scrollTo({ left: scrollWidth, behavior: "smooth" });
      } else {
        ref.current.scrollBy({ left: -CARD_WIDTH, behavior: "smooth" });
      }
    }
  };

  return (
    <section style={{ marginBottom: 44 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2
            style={{
              fontSize: "clamp(18px, 4vw, 25px)",
              fontWeight: 600,
              color: "#f5f5f5",
              margin: 0,
            }}
          >
            {title}
          </h2>
          {searchable && (
            <button
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "#1a1a1a",
                border: "1px solid #282828",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#555",
              }}
            >
              <Search size={11} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {(["l", "r"] as const).map((d) => (
            <button
              key={d}
              onClick={() => scroll(d)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#1a1a1a",
                border: "1px solid #282828",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888",
                transition: "background 0.12s ease, color 0.12s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#2a2a2a";
                (e.currentTarget as HTMLButtonElement).style.color = "#ddd";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#1a1a1a";
                (e.currentTarget as HTMLButtonElement).style.color = "#888";
              }}
            >
              {d === "l" ? (
                <ChevronLeft size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={ref}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: 6,
          paddingLeft: 2,
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* ─── Card components ────────────────────────────────────────────── */

function ImgModelCard({ m }: { m: ModelCard }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: 420,
        height: 300,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov
          ? "0 10px 36px rgba(0,0,0,0.55)"
          : "0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      <img
        src={m.thumb}
        alt={m.name}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          transform: hov ? "scale(1.05)" : "scale(1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          opacity: 1,
          transition: "opacity 0.3s ease",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          display: "flex",
          gap: 6,
          zIndex: 1,
        }}
      >
        {m.tags.map((t) => (
          <TagBadge key={t} label={t} />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 16px",
          zIndex: 1,
          transform: hov ? "translateY(-48px)" : "translateY(0)",
          transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 6,
            letterSpacing: "-0.01em",
          }}
        >
          {m.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#aaa",
            lineHeight: 1.45,
            marginBottom: 10,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {m.desc}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Dots count={m.speed} />
          <Dots count={m.quality} diamond />
          <span
            style={{
              marginLeft: "auto",
              fontSize: 13,
              color: "#888",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            ~{m.cost}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
            </svg>
          </span>
        </div>
      </div>
      <Link
        href="/dashboard/tools/image"
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          background: "#fff",
          color: "#000",
          textAlign: "center",
          fontWeight: 600,
          fontSize: 14,
          padding: "10px 0",
          borderRadius: 999,
          textDecoration: "none",
          zIndex: 1,
          opacity: hov ? 1 : 0,
          transform: hov ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: hov ? "auto" : "none",
        }}
      >
        Generate image
      </Link>
    </div>
  );
}

function VidModelCard({ m }: { m: VideoModel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (hov) videoRef.current.play().catch(() => {});
    else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hov]);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: 420,
        height: 300,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov
          ? "0 10px 36px rgba(0,0,0,0.55)"
          : "0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      <img
        src={m.thumb}
        alt={m.name}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "opacity 0.25s ease",
          opacity: 1,
        }}
      />
      <video
        ref={videoRef}
        src={m.videoUrl}
        muted
        loop
        autoPlay
        playsInline
        preload="auto"
        poster={m.thumb}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#000",
          opacity: 1,
          transition: "transform 0.25s ease",
          transform: hov ? "scale(1.02)" : "scale(1)",
        }}
      />
      <CardOverlay />
      {/* Play icon when not hovered */}
      {!hov && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <Play size={11} fill="#fff" color="#fff" />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          display: "flex",
          gap: 4,
          zIndex: 1,
        }}
      >
        {m.tags.map((t) => (
          <TagBadge key={t} label={t} />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 16px",
          zIndex: 1,
          transform: hov ? "translateY(-48px)" : "translateY(0)",
          transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 6,
            letterSpacing: "-0.01em",
          }}
        >
          {m.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#aaa",
            lineHeight: 1.45,
            marginBottom: 10,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {m.desc}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Dots count={m.speed} />
          <Dots count={m.quality} diamond />
          <span
            style={{
              marginLeft: "auto",
              fontSize: 13,
              color: "#888",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            ~{m.cost}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
            </svg>
          </span>
        </div>
      </div>
      <Link
        href="/dashboard/tools/video"
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          textAlign: "center",
          fontWeight: 600,
          fontSize: 14,
          padding: "10px 0",
          borderRadius: 999,
          textDecoration: "none",
          zIndex: 1,
          opacity: hov ? 1 : 0,
          transform: hov ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: hov ? "auto" : "none",
        }}
      >
        Generate Video
      </Link>
    </div>
  );
}
function NodeAppCard({ app }: { app: (typeof NODE_APPS)[0] }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: 260,
        height: 360, // 🔥 taller like design
        borderRadius: 16,
        opacity: hover ? 1 : 0.95,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover
          ? "0 12px 40px rgba(0,0,0,0.6)"
          : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* IMAGE */}
      <img
        src={app.thumb}
        alt={app.name}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: hover ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.4s ease",
        }}
      />

      {/* 🔥 STRONG GRADIENT */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.2) 60%, transparent 100%)",
        }}
      />

      {/* TEXT */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "18px 16px",
          zIndex: 1,
          transform: hover ? "translateY(-48px)" : "translateY(0)",
          transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 6,
          }}
        >
          {app.name}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#aaa",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {app.desc}
        </div>
      </div>

      {/* 🔥 HOVER BUTTON */}
      <Link
        href="/dashboard/tools/image"
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          textAlign: "center",
          fontWeight: 600,
          fontSize: 14,
          padding: "10px 0",
          borderRadius: 999,
          textDecoration: "none",
          zIndex: 1,
          opacity: hover ? 1 : 0,
          transform: hover ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: hover ? "auto" : "none",
        }}
      >
        Try it
      </Link>
    </div>
  );
}
// function NodeAppCard({ app }: { app: (typeof NODE_APPS)[0] }) {
//   const [hov, setHov] = useState(false);
//   return (
//     <div
//       onMouseEnter={() => setHov(true)}
//       onMouseLeave={() => setHov(false)}
//       style={{
//         position: "relative",
//         flexShrink: 0,
//         width: 250,
//         height: 210,
//         borderRadius: 12,
//         overflow: "hidden",
//         cursor: "pointer",
//         transition: "transform 0.2s ease, box-shadow 0.2s ease",
//         transform: hov ? "translateY(-3px)" : "none",
//         boxShadow: hov
//           ? "0 10px 36px rgba(0,0,0,0.55)"
//           : "0 2px 10px rgba(0,0,0,0.3)",
//       }}
//     >
//       <img
//         src={app.thumb}
//         alt={app.name}
//         style={{
//           position: "absolute",
//           inset: 0,
//           width: "100%",
//           height: "100%",
//           objectFit: "cover",
//           transition: "transform 0.3s ease",
//           transform: hov ? "scale(1.05)" : "scale(1)",
//         }}
//       />
//       <CardOverlay />
//       <div
//         style={{
//           position: "absolute",
//           bottom: 0,
//           left: 0,
//           right: 0,
//           padding: "10px 12px",
//           zIndex: 1,
//         }}
//       >
//         <div
//           style={{
//             fontSize: 13,
//             fontWeight: 600,
//             color: "#f5f5f5",
//             marginBottom: 3,
//           }}
//         >
//           {app.name}
//         </div>
//         <div
//           style={{
//             fontSize: 11,
//             color: "#909090",
//             lineHeight: 1.45,
//             display: "-webkit-box",
//             WebkitLineClamp: 2,
//             WebkitBoxOrient: "vertical",
//             overflow: "hidden",
//           }}
//         >
//           {app.desc}
//         </div>
//       </div>
//       <TryBtn visible={hov} />
//     </div>
//   );
// }

function ReleaseCard({ note }: { note: (typeof RELEASE_NOTES)[0] }) {
  const [hov, setHov] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 16 : 24,
        alignItems: isMobile ? "stretch" : "flex-start",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: isMobile ? "100%" : 260,
          height: isMobile ? 200 : 160,
          borderRadius: 14,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={note.thumb}
          alt={note.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hov ? "scale(0.96)" : "scale(1)",
            transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
      <div style={{ flex: 1, paddingTop: isMobile ? 0 : 6 }}>
        <div
          style={{
            fontSize: isMobile ? 16 : 18,
            fontWeight: 600,
            color: "#f5f5f5",
            marginBottom: 10,
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
          }}
        >
          {note.title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#9ca3af",
            lineHeight: 1.5,
            marginBottom: 20,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontWeight: 400,
          }}
        >
          {note.desc}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>{note.date}</div>
      </div>
    </div>
  );
}

function ActionCard({ a }: { a: (typeof ACTIONS)[0] }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: 380,
        height: 200,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov
          ? "0 10px 36px rgba(0,0,0,0.55)"
          : "0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      <img
        src={a.thumb}
        alt={a.name}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.3s ease",
          transform: hov ? "scale(1.05)" : "scale(1)",
        }}
      />
      <CardOverlay />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 16px",
          zIndex: 1,
          transform: hov ? "translateY(-48px)" : "translateY(0)",
          transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#f5f5f5",
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}
        >
          {a.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#aaa",
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {a.desc}
        </div>
      </div>
      <Link
        href="/dashboard/tools/image"
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          background: "#fff",
          color: "#000",
          textAlign: "center",
          fontWeight: 600,
          fontSize: 14,
          padding: "10px 0",
          borderRadius: 999,
          textDecoration: "none",
          zIndex: 1,
          opacity: hov ? 1 : 0,
          transform: hov ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: hov ? "auto" : "none",
        }}
      >
        Try it
      </Link>
    </div>
  );
}

function Github({
  size = 24,
  ...props
}: {
  size?: number;
  [key: string]: any;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function Linkedin({
  size = 24,
  ...props
}: {
  size?: number;
  [key: string]: any;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function Footer() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const getLinkStyle = (label: string) => ({
    display: "block",
    color: "#a1a1aa",
    fontSize: 13,
    marginBottom: 14,
    textDecoration: hoveredLink === label ? "underline" : "none",
    cursor: "pointer",
  });

  return (
    <footer
      style={{
        paddingTop: 60,
        paddingBottom: 40,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        marginTop: 80,
      }}
    >
      {/* Top 4 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 30,
          marginBottom: 50,
        }}
      >
        {FOOTER_LINKS.map((col, i) => (
          <div key={i}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: "#f5f5f5",
                marginBottom: 24,
              }}
            >
              {col.title}
            </div>
            {col.links.map((link) => (
              <a
                key={link}
                style={getLinkStyle(link)}
                onMouseEnter={() => setHoveredLink(link)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ fontSize: 13, color: "#a1a1aa" }}>
          © 2026 Aarthi Honguthi
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <a
            href="https://aarthihonguthi.github.io/portfolio2.O/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#a1a1aa", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <Globe size={18} />
          </a>
          <a
            href="https://github.com/AarthiHonguthi"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#a1a1aa", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <Github size={18} />
          </a>
          <a
            href="https://www.linkedin.com/in/aarthi-honguthi-b01838257/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#a1a1aa", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <Linkedin size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */

// const HERO_SLIDES = [
//   {
//     type: "gradient",
//     bg: "radial-gradient(circle at 30% 30%, #0b2a3a, #020617)",
//     text: "Start by generating a free image",
//   },
//   {
//     type: "image",
//     bg: "url('/images/hero1.png')",
//     text: "Explore stunning AI images",
//   },
//   {
//     type: "image",
//     bg: "url('/images/hero2.png')",
//     text: "Create amazing visuals",
//   },
//   {
//     type: "video",
//     src: "url('/videos/hero.mp4')",
//     text: "Watch AI in action",
//   },
// ];
const HERO_SLIDES = [
  {
    type: "video",
    src: "/videos/hero.mp4", // ✅ FIXED
  },
  {
    type: "video",
    src: "/videos/galaxy/galaxy.mp4", // ✅ FIXED
  },
  {
    type: "gradient",
    bg: "radial-gradient(circle at 30% 30%, #0b2a3a, #020617)",
    text: "Start by generating a free image",
  },
  {
    type: "video",
    src: "/videos/doggy.mp4", // ✅ remove url()
  },
  {
    type: "image",
    bg: "/images/hero2.png", // ✅ remove url()
    text: "Explore stunning AI images",
  },
];

const MAIN_ACTIONS = [
  {
    id: "gen-img",
    title: "Generate Image",
    video: "/videos/01_video.mp4",
    icon: <ImageIcon size={28} color="#0ea5e9" strokeWidth={2.5} />,
    iconBg: "#ffffff",
  },
  {
    id: "gen-vid",
    title: "Generate Video",
    video: "/videos/02_video.mp4",
    icon: <Video size={28} color="#ffffff" strokeWidth={2.5} />,
    iconBg: "linear-gradient(135deg, #fbbf24, #f59e0b)",
  },
  {
    id: "upscale",
    title: "Upscale & Enhance",
    video: "/videos/03_video.mp4",
    icon: <Wand2 size={28} color="#ffffff" strokeWidth={2.5} />,
    iconBg: "linear-gradient(135deg, #3f3f46, #09090b)",
  },
  {
    id: "realtime",
    title: "Realtime",
    video: "/videos/04_video.mp4",
    icon: <PenTool size={28} color="#ffffff" strokeWidth={2.5} />,
    iconBg: "linear-gradient(135deg, #60a5fa, #2563eb)",
  },
];

function ActionVideoCard({ action }: { action: (typeof MAIN_ACTIONS)[0] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.setAttribute("defaultMuted", "");
    video.setAttribute("muted", "");
    video.defaultMuted = true;
    video.muted = true;

    const tryPlay = () => {
      video.play().catch(() => {
        const handleInteraction = () => {
          video.play().catch(() => {});
          window.removeEventListener("click", handleInteraction);
          window.removeEventListener("scroll", handleInteraction);
        };

        window.addEventListener("click", handleInteraction, { once: true });
        window.addEventListener("scroll", handleInteraction, { once: true });
      });
    };

    tryPlay();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: "pointer",
        flex: 1,
        minWidth: 200,
      }}
      onMouseEnter={() => {
        setHover(true);
        videoRef.current?.play().catch(() => {});
      }}
      onMouseLeave={() => {
        setHover(false);
      }}
      onClick={() => {
        videoRef.current?.play().catch(() => {});
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/10",
          borderRadius: 14,
          overflow: "hidden",
          background: "#161616",
        }}
      >
        <video
          ref={videoRef}
          src={action.video}
          muted
          loop
          playsInline
          preload="auto"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            background: "#111",
            transition: "transform 0.3s ease",
            transform: hover ? "scale(1.05)" : "scale(1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.15)",
            opacity: hover ? 0 : 1,
            transition: "opacity 0.2s ease",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: action.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {action.icon}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: "#f5f5f5",
          letterSpacing: "-0.01em",
        }}
      >
        {action.title}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [heroHover, setHeroHover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startX = useRef(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto loop removed by user request

  // Handle video playback when slide changes
  useEffect(() => {
    const video = videoRef.current;
    if (HERO_SLIDES[slideIdx].type === "video" && video) {
      video.setAttribute("defaultMuted", "");
      video.setAttribute("muted", "");
      video.defaultMuted = true;
      video.muted = true;
      video.currentTime = 0;

      const tryPlay = () => {
        video.play().catch(() => {
          console.log("Video autoplay failed, will try on user interaction");
        });
      };
      tryPlay();
    }
  }, [slideIdx]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        height: "100%",
        scrollbarWidth: "thin",
        scrollbarColor: "#2a2a2a transparent",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          padding: "20px 16px",
          margin: "0 auto",
        }}
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div
          onMouseEnter={() => setHeroHover(true)} // ✅ ADD
          onMouseLeave={(e) => {
            setHeroHover(false);
            if (isDragging) {
              const diff = e.clientX - startX.current;
              if (diff > 50) {
                setSlideIdx(
                  (i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
                );
              } else if (diff < -50) {
                setSlideIdx((i) => (i + 1) % HERO_SLIDES.length);
              }
            }
            setIsDragging(false);
            setDragOffset(0);
          }}
          onMouseDown={(e) => {
            // ✅ ADD DRAG
            setIsDragging(true);
            startX.current = e.clientX;
            setDragOffset(0);
          }}
          onMouseMove={(e) => {
            if (isDragging) {
              setDragOffset(e.clientX - startX.current);
            }
          }}
          onMouseUp={(e) => {
            if (!isDragging) return;

            const diff = e.clientX - startX.current;

            if (diff > 50) {
              setSlideIdx(
                (i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
              );
            } else if (diff < -50) {
              setSlideIdx((i) => (i + 1) % HERO_SLIDES.length);
            }

            setIsDragging(false);
            setDragOffset(0);
          }}
          style={{
            position: "relative",
            height: 390, // 🔥 slightly bigger
            borderRadius: 14,
            overflow: "hidden",
            marginTop: 20,
            marginBottom: 40,
            cursor: isDragging ? "grabbing" : "grab", // ✅ nice UX
          }}
        >
          {/* ✅ SLIDING TRACK */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              transform: `translateX(calc(-${slideIdx * 100}% + ${dragOffset}px))`,
              transition: isDragging
                ? "none"
                : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {HERO_SLIDES.map((slide, i) => (
              <div
                key={i}
                style={{
                  flex: "0 0 100%",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {slide.type === "gradient" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: slide.bg,
                      zIndex: 0,
                      pointerEvents: "none",
                    }}
                  />
                )}

                {slide.type === "image" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${slide.bg})`, // ✅ FIX
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      zIndex: 0,
                      pointerEvents: "none",
                    }}
                  />
                )}

                {slide.type === "video" && (
                  <video
                    ref={i === slideIdx ? videoRef : undefined}
                    src={slide.src}
                    autoPlay={i === slideIdx} // ✅ ONLY play active video
                    loop
                    muted
                    playsInline
                    preload="auto"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      background: "#000",
                      zIndex: 0,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "rgba(139,92,246,0.18)",
              filter: "blur(55px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -70,
              left: "15%",
              width: 220,
              height: 260,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.14)",
              filter: "blur(50px)",
              pointerEvents: "none",
            }}
          />

          {/* Title */}
          {/* <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              // paddingTop: 90,
            }}
          >
            <h1
              style={{
                fontSize: "clamp(18px, 2.8vw, 36px)",
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.025em",
                margin: 0,
                textShadow: "0 2px 20px rgba(0,0,0,0.4)",
                textAlign: "center",
              }}
            >
              {HERO_SLIDES[slideIdx].text}
            </h1>
          </div> */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform:
                heroHover && HERO_SLIDES[slideIdx].src !== "/videos/hero.mp4"
                  ? "translate(-50%, -120%)" // goes up on hover
                  : "translate(-50%, -50%)", // center
              left: "50%",

              transition: "all 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(28px, 4vw, 56px)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "#e5e5e5",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              {HERO_SLIDES[slideIdx].text}
            </h1>
          </div>

          {/* Quick action pills */}
          {/* <div
            style={{
              position: "absolute",
              bottom: 24,
              left: 0,
              right: 0,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              padding: "0 20px",
              flexWrap: "wrap",
            }}
          >
            {QUICK_TOOLS.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  borderRadius: 9,
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  textDecoration: "none",
                  transition: "background 0.15s ease, transform 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "rgba(255,255,255,0.18)";
                  (e.currentTarget as HTMLAnchorElement).style.transform =
                    "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "rgba(255,255,255,0.1)";
                  (e.currentTarget as HTMLAnchorElement).style.transform =
                    "translateY(0)";
                }}
              >
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#e5e5e5",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </span>
              </Link>
            ))}
          </div> */}
          {/* 🔥 HOVER BUTTONS */}
          <div
            className="mt-12 flex gap-4 justify-center"
            style={{
              position: "absolute",
              top: "62%",
              left: "50%",
              transform:
                heroHover && HERO_SLIDES[slideIdx].src !== "/videos/hero.mp4"
                  ? "translate(-50%, -60%)"
                  : "translate(-50%, -50%)",

              display: "flex",
              gap: 12,

              opacity:
                heroHover && HERO_SLIDES[slideIdx].src !== "/videos/hero.mp4"
                  ? 1
                  : 0,
              transition: "all 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <button
              className="px-8 py-4 text-lg font-medium rounded-full"
              style={{
                padding: "14px 28px",
                borderRadius: 999,
                background: "#fff",
                color: "#111",
                border: "none",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Generate Image →
            </button>

            <button
              style={{
                padding: "14px 28px",
                borderRadius: 999,
                background: "#fff",
                color: "#111",
                border: "none",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                backdropFilter: "blur(10px)",
              }}
            >
              Generate Video →
            </button>
          </div>

          {/* Slide indicators */}
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
            }}
          >
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIdx(i)}
                style={{
                  width: i === slideIdx ? 24 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === slideIdx ? "#fff" : "rgba(255,255,255,0.3)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 0.3s ease, background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Slide Controls ──────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: -20,
            marginBottom: 30,
            marginRight: 10,
          }}
        >
          <button
            onClick={() =>
              setSlideIdx(
                (i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
              )
            }
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#1e1e1e",
              border: "1px solid #2a2a2a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1e1e1e")}
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <button
            onClick={() => setSlideIdx((i) => (i + 1) % HERO_SLIDES.length)}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#1e1e1e",
              border: "1px solid #2a2a2a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1e1e1e")}
          >
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── MAIN ACTIONS GRID ───────────────────────────────────── */}
        <div style={{ display: "flex", gap: 20, marginBottom: 54 }}>
          {MAIN_ACTIONS.map((a) => (
            <ActionVideoCard key={a.id} action={a} />
          ))}
        </div>
        <div
          style={{
            height: 1,
            background: "rgba(255, 255, 255, 0.08)",
            marginBottom: 54,
          }}
        />

        {/* ── Try Max banner - Hidden on mobile ───────────────────────────────────────── */}
        <div className="try-max-banner-responsive">
          <TryMaxBanner />
        </div>

        {/* ── Explore image models ──────────────────────────────────── */}
        <Carousel title="Explore image models" searchable>
          {IMAGE_MODELS.map((m) => (
            <ImgModelCard key={m.id} m={m} />
          ))}
        </Carousel>

        {/* ── Try video models ──────────────────────────────────────── */}
        <Carousel title="Try video models" searchable>
          {VIDEO_MODELS.map((m) => (
            <VidModelCard key={m.id} m={m} />
          ))}
        </Carousel>

        {/* ── Section Divider ── */}
        <div
          style={{
            height: 1,
            background: "rgba(255, 255, 255, 0.08)",
            marginBottom: 54,
          }}
        />

        {/* ── Play with node apps ──────────────────────────────────── */}
        <section style={{ marginBottom: 44 }}>
          <h2
            style={{
              fontSize: 25,
              fontWeight: 600,
              color: "#f5f5f5",
              marginBottom: 14,
              margin: "0 0 14px",
              letterSpacing: "-0.015em",
            }}
          >
            Play with node apps
          </h2>
          <div
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              scrollbarWidth: "none",
              paddingBottom: 6,
              paddingRight: 24,
              justifyContent: "space-between",
            }}
          >
            {NODE_APPS.map((a) => (
              <NodeAppCard key={a.id} app={a} />
            ))}
          </div>
        </section>

        {/* ── Section Divider ── */}
        <div
          style={{
            height: 1,
            background: "rgba(255, 255, 255, 0.08)",
            marginBottom: 54,
          }}
        />

        {/* ── Release notes ────────────────────────────────────────── */}
        <section style={{ marginBottom: 44 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <h2
              style={{
                fontSize: "clamp(24px, 4vw, 30px)",
                fontWeight: 600,
                color: "#f5f5f5",
                margin: 0,
                letterSpacing: "-0.015em",
              }}
            >
              Release notes
            </h2>
            <button
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "none",
                color: "#f5f5f5",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.12)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.06)")
              }
            >
              View all
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
              gap: "40px 32px",
              maxWidth: "1200px",
            }}
            className="release-notes-grid"
          >
            {RELEASE_NOTES.map((n) => (
              <ReleaseCard key={n.id} note={n} />
            ))}
          </div>
          <style>{`
            @media (min-width: 768px) {
              .release-notes-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
          `}</style>
        </section>
        <div
          style={{
            height: 1,
            background: "rgba(255, 255, 255, 0.08)",
            marginBottom: 64,
          }}
        />

        {/* ── Instant results ──────────────────────────────────────── */}
        <Carousel title="Instant results with NextFlow actions">
          {ACTIONS.map((a) => (
            <ActionCard key={a.id} a={a} />
          ))}
        </Carousel>

        <Footer />
      </div>
    </div>
  );
}

function TryMaxBanner() {
  const [loaded, setLoaded] = useState(false);
  const features = [
    "Upscale images & videos to 22K",
    "Lora fine-tuning",
    "Access all 150+ models",
    "Ultra fast & no throttling",
  ];

  return (
    <div
      style={{
        padding: "24px 28px",
        borderRadius: 16,
        background: "#000000",
        border: "1px solid #1e1e1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 30,
        overflow: "hidden",
        marginBottom: 40,
      }}
    >
      {/* LEFT SIDE */}
      <Link
        href="/dashboard/pricing"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          textDecoration: "none",
        }}
      >
        {features.map((f) => (
          <div
            key={f}
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#f1eaeab2",
              display: "flex",
              alignItems: "center",
              letterSpacing: "-0.01em",
            }}
          >
            {f}
          </div>
        ))}
      </Link>

      {/* CENTER (TITLE + VIDEO) */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#3b82f6",
            marginBottom: 10,
            textShadow: "0 0 25px rgba(59,130,246,0.6)",
          }}
        ></div>

        <div
          style={{
            width: 420,
            height: 180,
            overflow: "hidden",
            borderRadius: 12,
            position: "relative",
          }}
        >
          <video
            src="/videos/max.mp4"
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={() => setLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: loaded ? 1 : 0,
              transition: "opacity 1.5s ease-in-out",
            }}
          />

          {/* subtle gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
            }}
          />
        </div>
      </div>

      {/* RIGHT SIDE IMAGE */}
      <div style={{ width: 280 }}>
        <img
          src="/images/stack.png"
          alt="stack"
          style={{
            width: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}

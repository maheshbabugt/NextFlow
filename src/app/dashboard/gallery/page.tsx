"use client";

// Gallery Page
// Displays user-generated images in a responsive grid
// Features: search/filter, sorting, typing effect animation for descriptions
// Uses memoization for performance optimization with large image lists
// Responsive grid: auto-fit columns based on viewport width

import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ─── Typing hook with memoization ─── */
// Custom hook for typewriter effect animation
// Cycles through: typing -> pause -> deleting -> repeat
// Memoized to prevent unnecessary re-renders
function useTypingEffect(text: string, speed = 90, pauseMs = 1800) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === "typing") {
      if (displayed.length < text.length) {
        timeout = setTimeout(
          () => setDisplayed(text.slice(0, displayed.length + 1)),
          speed
        );
      } else {
        timeout = setTimeout(() => setPhase("pause"), pauseMs);
      }
    } else if (phase === "pause") {
      timeout = setTimeout(() => setPhase("deleting"), 400);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(
          () => setDisplayed(displayed.slice(0, -1)),
          speed / 2
        );
      } else {
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, text, speed, pauseMs]);

  return displayed;
}

/* ─── Play Button - Memoized ─── */
const PlayBtn = React.memo(() => (
  <div style={s.playWrap}>
    <div style={s.playBtn}>▶</div>
  </div>
));
PlayBtn.displayName = "PlayBtn";

/* ─── Generic Card - Memoized ─── */
interface CardProps {
  gradient: string;
  gridColumn: string;
  gridRow: string;
  hasPlay?: boolean;
  label?: string;
  emoji?: string;
  aspectRatio?: string;
}

const Card = React.memo(({
  gradient,
  gridColumn,
  gridRow,
  hasPlay,
  label,
  emoji,
  aspectRatio,
}: CardProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...s.card,
        background: gradient,
        gridColumn,
        gridRow,
        aspectRatio: aspectRatio ?? undefined,
        transform: hovered
          ? "scale(1.03) translateY(-4px)"
          : "scale(1) translateY(0)",
        transition: "transform 0.35s cubic-bezier(.25,.8,.25,1)",
      } as React.CSSProperties}
    >
      {label && <span style={s.cardLabel}>{label}</span>}
      {emoji && <span style={s.cardEmoji}>{emoji}</span>}
      {hasPlay && <PlayBtn />}
    </div>
  );
});
Card.displayName = "Card";

/* ─── Card with Media - Memoized ─── */
interface MediaType {
  type: "video" | "image";
  src: string;
}

interface CardWithMediaProps extends CardProps {
  media?: MediaType;
}

const CardWithMedia = React.memo(({
  gradient,
  gridColumn,
  gridRow,
  hasPlay,
  label,
  emoji,
  media,
}: CardWithMediaProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...s.card,
        background: gradient,
        gridColumn,
        gridRow,
        transform: hovered
          ? "scale(1.03) translateY(-4px)"
          : "scale(1) translateY(0)",
        transition: "transform 0.35s cubic-bezier(.25,.8,.25,1)",
      } as React.CSSProperties}
    >
      {media && (
        <>
          {media.type === "video" ? (
            <video
              src={media.src}
              style={s.media}
              autoPlay
              muted
              loop
              preload="none"
            />
          ) : (
            <img src={media.src} style={s.media} alt="gallery" loading="lazy" />
          )}
        </>
      )}
      {label && <span style={s.cardLabel}>{label}</span>}
      {emoji && <span style={s.cardEmoji}>{emoji}</span>}
      {hasPlay && <PlayBtn />}
    </div>
  );
});
CardWithMedia.displayName = "CardWithMedia";

/* ─── Screen Typing - Memoized ─── */
const ScreenTyping = React.memo(() => {
  const typed = useTypingEffect("Please Hire Me", 85, 2000);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (typed === "Please Hire Me") {
      const timer = setTimeout(() => setShowImage(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowImage(false);
    }
  }, [typed]);

  return (
    <div style={s.screenTypingWrap}>
      <span style={s.screenTypingText}>
        {typed}
        {showImage ? (
          <img
            src="/images/cute.png"
            style={{
              width: 84,
              height: 84,
              display: "inline-block",
              verticalAlign: "middle",
              marginLeft: 8,
              borderRadius: 4,
            }}
            alt="smile"
            loading="lazy"
          />
        ) : (
          <span style={s.cursor}>|</span>
        )}
      </span>
    </div>
  );
});
ScreenTyping.displayName = "ScreenTyping";

/* ─── Marquee Row - Memoized ─── */
const MarqueeRow = React.memo(() => (
  <div style={s.marqueeInner}>
    {Array(8)
      .fill(null)
      .map((_, i) => (
        <span key={i} style={s.marqueeChunk}>
          OpenAI&nbsp;&nbsp;•&nbsp;&nbsp;Claude&nbsp;&nbsp;•&nbsp;&nbsp;Notion&nbsp;&nbsp;•&nbsp;&nbsp;Perplexity&nbsp;&nbsp;•&nbsp;&nbsp;
        </span>
      ))}
  </div>
));
MarqueeRow.displayName = "MarqueeRow";

/* ─── Main Page ─── */
export default function GalleryPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Memoize card data to prevent unnecessary re-renders
const cardData = useMemo(() => [
  /* ───────── HERO ───────── */
  {
    gridColumn: "1 / 5",
    gridRow: "1 / 3",
    gradient: "linear-gradient(160deg,#0d0d1a 0%,#1a1040 40%,#2d1b69 70%,#1a1040 100%)",
    label: "Galaxy Workflows",
    media: { type: "video" as const, src: "/videos/galaxy/video_1.mp4" },
  },

  /* ───────── ROW 2 ───────── */
  {
    gridColumn: "1 / 2",
    gridRow: "3 / 4",
    gradient: "linear-gradient(135deg,#0b1340 0%,#1a237e 50%,#283593 100%)",
    media: { type: "image" as const, src: "/images/galaxy/man.jpeg" },
  },
  {
    gridColumn: "2 / 3",
    gridRow: "3 / 4",
    gradient: "linear-gradient(135deg,#e91e63 0%,#f48fb1 40%,#fce4ec 100%)",
    label: "NEXT LEVEL AI VISUALS",
    media: { type: "image" as const, src: "/images/galaxy/image_1.png" },
  },
  {
    gridColumn: "3 / 4",
    gridRow: "3 / 4",
    gradient: "linear-gradient(135deg,#b39ddb 0%,#7e57c2 40%,#4a148c 100%)",
    media: { type: "video" as const, src: "/videos/galaxy/video_2.mp4" },
  },
  {
    gridColumn: "4 / 5",
    gridRow: "3 / 4",
    gradient: "linear-gradient(135deg,#1b5e20 0%,#2e7d32 50%,#388e3c 100%)",
    media: { type: "image" as const, src: "/images/galaxy/image_2.jpeg" },
  },

  /* ───────── ROW 3 & 4 STRUCTURE ───────── */

  // Tall left (starts AFTER row 2)
  {
    gridColumn: "1 / 2",
    gridRow: "4 / 6",
    gradient: "linear-gradient(180deg,#2d2d2d 0%,#1a1a1a 50%,#3d2b1f 100%)",
    media: { type: "video" as const, src: "/videos/galaxy/video.mp4" },
  },

  // Wide center
  {
    gridColumn: "2 / 4",
    gridRow: "4 / 5",
    gradient: "linear-gradient(135deg,#f8bbd9 0%,#f48fb1 30%,#c2755a 60%,#8d5524 100%)",
    media: { type: "image" as const, src: "/images/galaxy/image.png" },
  },

  // Right small
  {
    gridColumn: "4 / 5",
    gridRow: "4 / 5",
    gradient: "linear-gradient(135deg,#e8f5e9 0%,#a5d6a7 40%,#81c784 100%)",
    media: { type: "video" as const, src: "/videos/galaxy/video_4.mp4" },
  },

  /* ───────── ROW 5 ───────── */

  {
    gridColumn: "2 / 3",
    gridRow: "5 / 6",
    gradient: "linear-gradient(135deg,#e3f2fd 0%,#90caf9 50%,#42a5f5 100%)",
    media: { type: "image" as const, src: "/images/galaxy/image_4.jpeg" },
  },

  {
    gridColumn: "3 / 5",
    gridRow: "5 / 6",
    gradient: "linear-gradient(135deg,#1a1a1a 0%,#111 100%)",
    media: { type: "image" as const, src: "/images/galaxy/image.jpeg" },
  },
], [isMobile]);

  return (
    <div style={s.page}>
      <div style={s.grid}>
        {cardData.map((card, idx) => (
          <CardWithMedia key={idx} {...card} />
        ))}
      </div>

      <ScreenTyping />

      <div style={s.marqueeOuter}>
        <div style={s.marqueeTrack}>
          <MarqueeRow />
          <MarqueeRow />
        </div>
      </div>

      <style jsx>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ─── */
const s: { [key: string]: React.CSSProperties } = {
  page: {
    background: "#0b0b0b",
    minHeight: "100vh",
    padding: "clamp(12px, 2vw, 18px) clamp(12px, 2vw, 20px) clamp(24px, 4vw, 32px)",
    color: "#fff",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    overflowX: "hidden",
  } as React.CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))",
    gridAutoRows: "clamp(140px, 20vw, 200px)",
    gap: 12,
  } as React.CSSProperties,
  card: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
    willChange: "transform",
  } as React.CSSProperties,
  media: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  } as React.CSSProperties,
  cardLabel: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    textShadow: "0 1px 8px rgba(0,0,0,0.7)",
  } as React.CSSProperties,
  cardEmoji: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    fontSize: 36,
    filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
  } as React.CSSProperties,
  playWrap: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.18)",
  } as React.CSSProperties,
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    border: "1.5px solid rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#fff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  } as React.CSSProperties,
  screenTypingWrap: {
    padding: "clamp(24px, 4vw, 32px) 4px 8px",
  } as React.CSSProperties,
  screenTypingText: {
    fontSize: "clamp(24px, 5vw, 36px)",
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  } as React.CSSProperties,
  typeText: {
    fontSize: 22,
    fontWeight: 600,
    lineHeight: 1.5,
    color: "#eeeeee",
    letterSpacing: "-0.01em",
    margin: 0,
  } as React.CSSProperties,
  cursor: {
    display: "inline-block",
    marginLeft: 2,
    color: "#a78bfa",
    animation: "blink 1s step-end infinite",
    fontWeight: 300,
  } as React.CSSProperties,
  marqueeOuter: {
    marginTop: 36,
    overflow: "hidden",
    whiteSpace: "nowrap",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: 20,
  } as React.CSSProperties,
  marqueeTrack: {
    display: "inline-flex",
    animation: "marqueeScroll 22s linear infinite",
  } as React.CSSProperties,
  marqueeInner: {
    display: "inline-flex",
  } as React.CSSProperties,
  marqueeChunk: {
    fontSize: "clamp(16px, 3vw, 22px)",
    fontWeight: 500,
    color: "rgba(255,255,255,0.12)",
    letterSpacing: "0.06em",
    paddingRight: 0,
  } as React.CSSProperties,
};

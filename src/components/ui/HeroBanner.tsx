"use client";

/**
 * components/ui/HeroBanner.tsx
 *
 * The large gradient hero at the top of the dashboard.
 * Krea uses a warm orange→coral gradient.
 * We add a subtle shimmer animation to make it feel alive.
 */

import { cn } from "@/lib/utils";

interface HeroBannerProps {
  title?: string;
  className?: string;
}

export default function HeroBanner({
  title = "Start building your first workflow",
  className,
}: HeroBannerProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden",
        "h-[260px] flex items-center justify-center",
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, #e8622a 0%, #c9502a 20%, #d4614a 45%, #c4526c 70%, #b5638f 100%)",
      }}
    >
      {/* Shimmer overlay — a slowly drifting highlight that gives depth */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(255,200,150,0.5) 0%, transparent 70%)",
          animation: "shimmer 8s ease-in-out infinite alternate",
        }}
      />

      {/* Subtle noise texture feel via a faint pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundSize: "150px 150px",
        }}
      />

      {/* Hero text */}
      <p
        className="relative z-10 text-white text-[28px] font-semibold text-center px-8 leading-tight"
        style={{
          textShadow: "0 2px 20px rgba(0,0,0,0.25)",
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </p>

      {/* keyframe is injected via a style tag — works in Next.js without a CSS file */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-10%) translateY(-5%) scale(1); }
          100% { transform: translateX(10%)  translateY(5%)  scale(1.05); }
        }
      `}</style>
    </div>
  );
}

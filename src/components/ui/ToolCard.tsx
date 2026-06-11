"use client";

/**
 * components/ui/ToolCard.tsx
 *
 * Individual tool card shown in the dashboard grid.
 * Has a thumbnail image, an icon overlay badge, and a label below.
 */

import Image from "next/image";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  label: string;
  thumbnail: string; // path or URL to the thumbnail
  badgeIcon: LucideIcon;
  badgeColor?: string; // hex colour for the badge background
  onClick?: () => void;
}

export default function ToolCard({
  label,
  thumbnail,
  badgeIcon: BadgeIcon,
  badgeColor = "#F5A623",
  onClick,
}: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group flex flex-col gap-2 text-left", // 👈 ADD relative here
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]",
      )}
    >
      {/* Thumbnail container */}
      <div
        className={cn(
          "relative w-full h-40 rounded-xl overflow-hidden",
          "bg-[#1e1e1e]",
          "ring-1 ring-[#2a2a2a]",
          "transition-transform duration-200 group-hover:scale-[1.02]",
          "group-hover:ring-[#3a3a3a]",
        )}
      >
        {/* Thumbnail image */}
        <Image
          src={thumbnail}
          alt={label}
          width={400}
          height={300}
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {/* Badge icon in bottom-left */}
        <div
          className="absolute bottom-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
          style={{ backgroundColor: badgeColor }}
        >
          <BadgeIcon size={14} className="text-white" />
        </div>
      </div>

      {/* Label */}
      <span className="text-[13px] font-medium text-[#bbb] group-hover:text-[#e0e0e0] transition-colors px-0.5">
        {label}
      </span>
    </button>
  );
}

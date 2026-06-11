"use client";

import React, { useState, useEffect } from "react";
import { Plus, ImagePlus, Diamond, Square, AtSign } from "lucide-react";

export default function NanoBananaPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return (
    <div style={{ ...styles.container, paddingTop: isMobile ? "60px" : "0" }}>
      {/* Center */}
      <div style={styles.center}>
        {/* Title */}
        <div style={{ ...styles.titleRow, gap: isMobile ? 10 : 14 }}>
          <div style={{ ...styles.iconBox, width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, fontSize: isMobile ? 18 : 22 }}>🍌</div>
          <h1 style={{ ...styles.title, fontSize: isMobile ? 32 : 42 }}>Nano Banana Pro</h1>
        </div>

        {/* Prompt Box */}
        <div style={{ ...styles.promptBox, width: isMobile ? "calc(100% - 32px)" : "700px", maxWidth: "90%", padding: isMobile ? "14px 14px 10px" : "18px 18px 12px" }}>
          {/* Input */}
          <input
            placeholder="Ask Nano Banana to generate anything or upload an image to edit it..."
            style={{ ...styles.input, fontSize: isMobile ? 14 : 15 }}
          />

          {/* Bottom Controls */}
          <div style={{ ...styles.controls, flexWrap: "wrap", gap: isMobile ? 6 : 8 }}>
            <div style={{ ...styles.leftControls, gap: isMobile ? 6 : 8 }}>
              <Chip label="Nano Banana Pro" active isMobile={isMobile} />
              <Chip label="+ Add images" icon={<ImagePlus size={isMobile ? 12 : 14} />} isMobile={isMobile} />
              <Chip label="1:1" icon={<Square size={isMobile ? 12 : 14} />} isMobile={isMobile} />
              <Chip label="1K" icon={<Diamond size={isMobile ? 12 : 14} />} isMobile={isMobile} />
              <Chip label="Context" icon={<AtSign size={isMobile ? 12 : 14} />} isMobile={isMobile} />
              <Chip label="Elements" icon={<AtSign size={isMobile ? 12 : 14} />} isMobile={isMobile} />
            </div>

            {/* Generate Button */}
            <button style={{ ...styles.generateBtn, width: isMobile ? 32 : 38, height: isMobile ? 32 : 38 }}>
              <Plus size={isMobile ? 16 : 18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────── */

function Chip({
  label,
  icon,
  active,
  isMobile,
}: {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  isMobile?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: isMobile ? "6px 10px" : "8px 12px",
        borderRadius: 20,
        background: active ? "#2a2a2a" : "#1c1c1c",
        color: active ? "#fff" : "#bbb",
        fontSize: isMobile ? 12 : 13,
        fontWeight: 500,
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "all 0.15s ease",
      }}
    >
      {icon}
      {label}
    </div>
  );
}

/* ───────────────────────────────────────── */

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    width: "100%",
    background: "#0b0b0b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 28,
    width: "100%",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: "linear-gradient(135deg,#facc15,#eab308)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  },

  title: {
    fontSize: 42,
    fontWeight: 600,
    margin: 0,
  },

  promptBox: {
    width: "700px",
    maxWidth: "90%",
    borderRadius: 28,
    padding: "18px 18px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
  },

  input: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#ddd",
    fontSize: 15,
    marginBottom: 16,
  },

  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftControls: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  generateBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "none",
    background: "#2a2a2a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};
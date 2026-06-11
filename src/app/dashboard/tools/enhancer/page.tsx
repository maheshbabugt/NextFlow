"use client";

import React, { useState, useEffect } from "react";
import { Plus, ImageIcon } from "lucide-react";

export default function EnhancerPage() {
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
      {/* Top Left Model */}
      <div style={{ ...styles.topBar, padding: isMobile ? "16px 20px" : "20px 28px", fontSize: isMobile ? 13 : 14 }}>
        <span style={styles.modelText}>Model Krea Enhance</span>
        <span style={styles.dropdown}>▾</span>
      </div>

      {/* Center Card */}
      <div style={styles.center}>
        <div style={{ ...styles.card, width: isMobile ? "calc(100% - 32px)" : 420, maxWidth: isMobile ? "100%" : 420 }}>
          {/* Video Section */}
          <div style={{ ...styles.videoWrapper, height: isMobile ? 160 : 220 }}>
            <video
              src="/videos/03_video.mp4"
              autoPlay
              muted
              loop
              playsInline
              style={styles.video}
            />
          </div>

          {/* Content */}
          <div style={{ ...styles.content, padding: isMobile ? "20px 20px 16px" : "28px 28px 22px" }}>
            {/* Title */}
            <div style={{ ...styles.titleRow, gap: isMobile ? 8 : 10 }}>
              <div style={{ ...styles.iconBox, width: isMobile ? 32 : 36, height: isMobile ? 32 : 36 }}>
                {/* sparkle svg */}
                <svg
                  width={isMobile ? 16 : 18}
                  height={isMobile ? 16 : 18}
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14zM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14z" />
                </svg>
              </div>

              <h1 style={{ ...styles.title, fontSize: isMobile ? 28 : 36 }}>Enhancer</h1>
            </div>

            {/* Description */}
            <p style={{ ...styles.desc, fontSize: isMobile ? 13 : 14 }}>
              Upscale images up to 22K or videos up to 8K resolution, and add new details.
            </p>

            {/* Buttons */}
            <div style={{ ...styles.btnRow, gap: isMobile ? 8 : 12, flexWrap: "wrap" }}>
              <button style={{ ...styles.uploadBtn, padding: isMobile ? "10px 16px" : "12px 22px", fontSize: isMobile ? 13 : 14 }}>
                <Plus size={isMobile ? 14 : 16} />
                Upload
              </button>

              <button style={{ ...styles.assetBtn, padding: isMobile ? "10px 16px" : "12px 22px", fontSize: isMobile ? 13 : 14 }}>
                <ImageIcon size={isMobile ? 14 : 16} />
                Select asset
              </button>
            </div>

            {/* Footer */}
            <p style={{ ...styles.footer, fontSize: isMobile ? 11 : 12 }}>Max 75MB / 15 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    width: "100%",
    background: "#0b0b0b",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
  },

  topBar: {
    padding: "20px 28px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#aaa",
    fontSize: 14,
  },

  modelText: {
    fontWeight: 500,
  },

  dropdown: {
    fontSize: 12,
  },

  center: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: 420,
    borderRadius: 28,
    overflow: "hidden",
    background: "#1a1a1a",
    boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
  },

  videoWrapper: {
    width: "100%",
    height: 220,
    overflow: "hidden",
  },

  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "grayscale(100%) contrast(1.1)",
  },

  content: {
    padding: "28px 28px 22px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#2a2a2a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 36,
    fontWeight: 600,
    margin: 0,
  },

  desc: {
    fontSize: 14,
    color: "#b5b5b5",
    lineHeight: 1.6,
    marginBottom: 24,
    maxWidth: 300,
  },

  btnRow: {
    display: "flex",
    gap: 12,
    marginBottom: 18,
  },

  uploadBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(37,99,235,0.4)",
  },

  assetBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    borderRadius: 12,
    border: "none",
    background: "#2a2a2a",
    color: "#cfcfcf",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },

  footer: {
    fontSize: 12,
    color: "#666",
  },
};
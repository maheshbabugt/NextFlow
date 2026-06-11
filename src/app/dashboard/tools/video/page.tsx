"use client";

import React, { useState, useEffect } from "react";

export default function Page() {
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
      {/* Top Model Selector */}
      <div style={{ ...styles.topBar, padding: isMobile ? "16px 20px" : "20px 30px", fontSize: isMobile ? 13 : 14 }}>
        <span style={styles.modelText}>Model Hailuo 2.3 Fast</span>
        <span style={styles.dropdown}>▾</span>
      </div>

      {/* Center Content */}
      <div style={styles.center}>
        {/* Title */}
        <div style={{ ...styles.titleWrapper, marginBottom: isMobile ? 20 : 30, gap: isMobile ? 10 : 14 }}>
          <div style={{ ...styles.iconBox, width: isMobile ? 36 : 42, height: isMobile ? 36 : 42 }}>
            <svg
              width={isMobile ? 18 : 20}
              height={isMobile ? 18 : 20}
              viewBox="0 0 24 24"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17 10.5V6c0-1.1-.9-2-2-2H5C3.9 4 3 4.9 3 6v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4.5l4 4v-11l-4 4z" />
            </svg>
          </div>
          <h1 style={{ ...styles.title, fontSize: isMobile ? 32 : 40 }}>Hailuo 2.3 Fast</h1>
        </div>

        {/* Input Box */}
        <div style={{ ...styles.inputContainer, width: isMobile ? "calc(100% - 32px)" : "640px", maxWidth: "90%", padding: isMobile ? "14px 16px 44px" : "18px 20px 50px" }}>
          <input
            placeholder="Describe a video and click generate..."
            style={{ ...styles.input, fontSize: isMobile ? 14 : 16 }}
          />

          {/* Bottom Options */}
          <div style={{ ...styles.options, gap: isMobile ? 6 : 10 }}>
            <span style={{ ...styles.option, fontSize: isMobile ? 11 : 12, padding: isMobile ? "5px 10px" : "6px 12px" }}>Hailuo 2.3 Fast</span>
            <span style={{ ...styles.option, fontSize: isMobile ? 11 : 12, padding: isMobile ? "5px 10px" : "6px 12px" }}>Start frame</span>
            <span style={{ ...styles.option, fontSize: isMobile ? 11 : 12, padding: isMobile ? "5px 10px" : "6px 12px" }}>768p</span>
            <span style={{ ...styles.option, fontSize: isMobile ? 11 : 12, padding: isMobile ? "5px 10px" : "6px 12px" }}>6s</span>
          </div>

          {/* Generate Button */}
          <button style={{ ...styles.generateBtn, width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, right: isMobile ? 10 : 12, bottom: isMobile ? 8 : 10 }}>✦</button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    width: "100%",
    backgroundColor: "#0b0b0b",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
  },

  topBar: {
    padding: "20px 30px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    color: "#aaa",
  },

  modelText: {
    fontWeight: 500,
  },

  dropdown: {
    fontSize: "12px",
  },

  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  titleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "30px",
  },

  iconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #ffcc00, #ff9900)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: "20px",
  },

  title: {
    fontSize: "40px",
    fontWeight: 600,
    margin: 0,
  },

  inputContainer: {
    width: "640px",
    maxWidth: "90%",
    backgroundColor: "#1a1a1a",
    borderRadius: "28px",
    padding: "18px 20px 50px 20px",
    position: "relative",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.05)",
  },

  input: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#ccc",
    fontSize: "16px",
  },

  options: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    flexWrap: "wrap",
  },

  option: {
    backgroundColor: "#2a2a2a",
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    color: "#ccc",
  },

  generateBtn: {
    position: "absolute",
    right: "12px",
    bottom: "10px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#3a3a3a",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
  },
};
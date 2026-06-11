"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  onComplete: (name: string) => void;
}

export default function OnboardingModal({ onComplete }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // Use entered name or generate dummy
    const displayName = name.trim() || "User" + Math.floor(1000 + Math.random() * 9000);
    setLoading(true);

    try {
      await fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      onComplete(displayName);
    } catch (err) {
      console.error("Failed to save display name:", err);
      // Still complete even if API fails
      onComplete(displayName);
    } finally {
      setLoading(false);
    }
  }

  async function handleClose() {
    // Close without input - generate dummy name
    const dummyName = "User" + Math.floor(1000 + Math.random() * 9000);
    setLoading(true);

    try {
      await fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: dummyName }),
      });
      onComplete(dummyName);
    } catch (err) {
      console.error("Failed to save dummy name:", err);
      // Still complete even if API fails
      onComplete(dummyName);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          zIndex: 9998,
        }}
      />

      {/* Modal Popup */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          padding: "48px 40px",
          width: "90%",
          maxWidth: "420px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          animation: "popupIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          ✕
        </button>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: "32px" }}>
            <ConcentricCircles />
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
              textAlign: "center",
            }}
          >
            Welcome to Galaxy.ai
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 28px",
              textAlign: "center",
            }}
          >
            What can we call you?
          </p>

          {/* Input */}
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={40}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "10px",
              color: "#ffffff",
              fontSize: "14px",
              outline: "none",
              textAlign: "center",
              transition: "all 0.2s ease",
              marginBottom: "24px",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
          />

          {/* Continue Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 24px",
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "..." : "Continue"}
          </button>

          {/* Skip Text */}
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.4)",
              margin: "16px 0 0",
              textAlign: "center",
            }}
          >
            Or close the popup to use a random name
          </p>
        </form>
      </div>

      <style>{`
        @keyframes popupIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
}

/* ─── Concentric circles SVG ─────────────────────────────────────────── */
function ConcentricCircles() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="36" cy="36" r="34" stroke="white" strokeWidth="1.5" />
      <circle cx="36" cy="36" r="22" stroke="white" strokeWidth="1.5" />
      <circle cx="36" cy="36" r="11" stroke="white" strokeWidth="1.5" />
      <circle cx="36" cy="36" r="3" fill="white" />
    </svg>
  );
}

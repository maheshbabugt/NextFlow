"use client";

import { useState, useEffect, useRef } from "react";

const images = [
  "/images/real_work/image.png",
  "/images/real_work/image copy.png",
  "/images/real_work/image copy 2.png",
  "/images/real_work/image copy 3.png",
];

export default function TrainLoraPage() {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hoverIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isHovering) {
      if (hoverIntervalRef.current) clearInterval(hoverIntervalRef.current);
      setCurrentImageIdx(0);
      return;
    }

    hoverIntervalRef.current = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => {
      if (hoverIntervalRef.current) clearInterval(hoverIntervalRef.current);
    };
  }, [isHovering]);

  return (
    <div style={{ background: "#050505", minHeight: "100vh", overflow: "auto" }}>
      <style jsx>{`
        @media (min-width: 768px) {
          .train-lora-header {
            flex-direction: row !important;
            align-items: flex-start !important;
          }
        }
        @media (max-width: 767px) {
          .train-lora-header {
            padding-top: 60px !important;
          }
        }
      `}</style>
      {/* Header Section */}
      <div
        style={{
          padding: isMobile ? "60px 16px 40px" : "clamp(32px, 6vw, 60px) clamp(20px, 4vw, 48px)",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? "24px" : "clamp(32px, 5vw, 60px)",
          alignItems: "flex-start",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
        className="train-lora-header"
      >
        {/* Left Content */}
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : "500px" }}>
          <div style={{ flex: "0 0 400px" }}>
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      marginBottom: "24px",
    }}
  >
    {/* New Icon */}
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "#171717",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "4px",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="9" r="5" fill="#ef4444" style={{ mixBlendMode: "screen" }} />
        <circle cx="8" cy="15" r="5" fill="#3b82f6" style={{ mixBlendMode: "screen" }} />
        <circle cx="16" cy="15" r="5" fill="#22c55e" style={{ mixBlendMode: "screen" }} />
      </svg>
    </div>

    {/* Title */}
    <h1
      style={{
        fontSize: isMobile ? "clamp(20px, 5vw, 28px)" : "clamp(24px, 5vw, 32px)",
        fontWeight: "700",
        color: "#fff",
        margin: "0 0 20px 0",
        lineHeight: "1.2",
      }}
    >
      Train Lora
    </h1>
  </div>
</div>

          <p
            style={{
              fontSize: isMobile ? "14px" : "15px",
              color: "rgba(255,255,255,0.7)",
              lineHeight: "1.6",
              marginBottom: "32px",
              maxWidth: isMobile ? "100%" : "380px",
            }}
          >
            Teach a model to generate specific styles, faces, or products. Upload images of the same subject and let Krea
            analyze the content over a few minutes. Load your Loras in the image and video models to use them.
          </p>

          <button
            style={{
              padding: "12px 28px",
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Train now Lora <span>→</span>
          </button>
        </div>

        {/* Right Single Image */}
        <div
          style={{
            width: "100%",
            height: isMobile ? "clamp(200px, 50vw, 280px)" : "clamp(240px, 40vw, 320px)",
            borderRadius: "12px",
            overflow: "hidden",
            position: "relative",
            cursor: "pointer",
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
         <video
  src="/videos/galaxy/video.mp4"
  autoPlay
  loop
  muted
  playsInline
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }}
/>
        </div>
      </div>

      {/* No LoRAs Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "60px 16px" : "clamp(60px, 10vw, 120px) clamp(20px, 4vw, 48px)",
          textAlign: "center",
          gap: "14px",
        }}
      >
        <div
      style={{
        width: isMobile ? 56 : 64,
        height: isMobile ? 56 : 64,
        borderRadius: 10,
        background: "#171717",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 24 24" width={isMobile ? 44 : 54} height={isMobile ? 44 : 54}>
        <circle cx="12" cy="9" r="5" fill="#ef4444" style={{ mixBlendMode: "screen" }} />
        <circle cx="8" cy="15" r="5" fill="#3b82f6" style={{ mixBlendMode: "screen" }} />
        <circle cx="16" cy="15" r="5" fill="#22c55e" style={{ mixBlendMode: "screen" }} />
      </svg>
    </div>

        <h2 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: "700", color: "#fff", marginBottom: "12px", margin: 0 }}>
          No LoRAs yet
        </h2>

        <p
          style={{
            fontSize: isMobile ? "13px" : "14px",
            color: "rgba(255,255,255,0.6)",
            marginBottom: "40px",
            maxWidth: isMobile ? "100%" : "500px",
            lineHeight: "1.6",
          }}
        >
          Loras are customized models. Upload images of the same object, face, or style, to teach models how to reproduce
          them.
        </p>

        <button
          style={{
            padding: "12px 40px",
            background: "#fff",
            color: "#000",
            border: "none",
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "24px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Train Lora
        </button>

        <a
          href="#"
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }}
        >
          Learn More
        </a>
      </div>
    </div>
  );
}

"use client";

// Pricing Page
// Displays subscription plans (Basic, Pro, Max) with pricing tiers
// Features: monthly/yearly toggle, animated price updates, slider for Max plan customization
// Key: AnimatedPrice component smoothly animates price changes when slider moves
// Mobile responsive: single column layout on mobile, grid on desktop

import React, { useState, useEffect, useCallback } from "react";

// Memoized animated number component
// Smoothly animates price changes with 15-step interpolation
// Used for Max plan price that changes based on compute unit slider
const AnimatedPrice = React.memo(({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue === value) return;

    setIsAnimating(true);
    const diff = value - displayValue;
    const steps = 15;
    const stepValue = diff / steps;
    let current = displayValue;
    let step = 0;

    // Animate price change over 600ms (15 steps * 40ms)
    const interval = setInterval(() => {
      step++;
      current += stepValue;
      if (step >= steps) {
        setDisplayValue(value);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, 40);

    return () => clearInterval(interval);
  }, [value, displayValue]);

  return (
    <span
      style={{
        display: "inline-block",
        transition: "transform 0.1s ease",
        transform: isAnimating ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {displayValue}
    </span>
  );
});
AnimatedPrice.displayName = "AnimatedPrice";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [maxSliderValue, setMaxSliderValue] = useState(60);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate Max plan price based on slider (60k = $105, scales up)
  const calculateMaxPrice = (units: number) => {
    const basePrice = 105;
    const baseUnits = 60;
    return Math.round((basePrice / baseUnits) * units);
  };

  const maxPrice = calculateMaxPrice(maxSliderValue);

  return (
    <div
      style={{
        background: "#0a0a0a",
        minHeight: "100%",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        color: "#fff",
        padding: isMobile ? "16px 12px" : "24px 20px",
      }}
    >
      {/* Hero Banner with Background Image */}
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: isMobile ? "12px" : "20px",
          padding: isMobile ? "32px 20px" : "48px 40px",
          marginBottom: isMobile ? "32px" : "48px",
          position: "relative",
          overflow: "hidden",
          maxWidth: "1400px",
          margin: isMobile ? "60px auto 32px" : "0 auto 48px",
        }}
      >
        {/* Background Image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/images/stack.png')",
            backgroundSize: "cover",
            backgroundPosition: "center right",
            opacity: 0.4,
            zIndex: 0,
          }}
        />
        
        {/* Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.7) 50%, rgba(26,26,26,0.3) 100%)",
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: isMobile ? "100%" : "600px" }}>
          <h2
            style={{
              fontSize: isMobile ? "clamp(24px, 5vw, 32px)" : "clamp(28px, 4vw, 36px)",
              fontWeight: 700,
              marginBottom: isMobile ? "12px" : "16px",
              color: "#fff",
            }}
          >
            Why choose Galaxy.ai
          </h2>
          <p
            style={{
              fontSize: isMobile ? "clamp(13px, 3vw, 15px)" : "clamp(14px, 2vw, 16px)",
              color: "#ccc",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Galaxy.ai is the world's best creative AI studio. With industry leading generation speeds,
            over 150 models including Nano Banana, Topaz, Magnific, Seedance, and a community of
            over 10 million users, Galaxy.ai is the best platform to create with AI.
          </p>
        </div>
      </div>

      {/* Toggle Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: isMobile ? "12px" : "16px",
          marginBottom: isMobile ? "32px" : "48px",
          flexWrap: "wrap",
          padding: isMobile ? "0 12px" : "0 20px",
        }}
      >
        <span style={{ fontSize: isMobile ? "13px" : "14px", color: "#999" }}>Monthly</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          style={{
            width: "52px",
            height: "30px",
            background: isYearly ? "#3b82f6" : "#333",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.3s ease",
            padding: "3px",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              background: "#fff",
              borderRadius: "50%",
              transition: "transform 0.3s ease",
              transform: isYearly ? "translateX(22px)" : "translateX(0)",
            }}
          />
        </button>
        <span style={{ fontSize: isMobile ? "13px" : "14px", color: "#999" }}>Yearly</span>
        <span
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "#fff",
            fontSize: isMobile ? "11px" : "12px",
            fontWeight: 600,
            padding: isMobile ? "5px 10px" : "6px 12px",
            borderRadius: "999px",
          }}
        >
          Save 20% on yearly plans
        </span>
      </div>

      {/* Pricing Cards Container */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "0 12px" : "0 20px" }}>
        {/* Section Title */}
        <h3
          style={{
            fontSize: isMobile ? "clamp(20px, 5vw, 26px)" : "clamp(22px, 3vw, 28px)",
            fontWeight: 700,
            marginBottom: isMobile ? "24px" : "32px",
            color: "#fff",
          }}
        >
          For Individual Creators
        </h3>

        {/* Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: isMobile ? "16px" : "20px",
            marginBottom: isMobile ? "40px" : "60px",
          }}
        >
          {/* Basic Card */}
          <PricingCard
            name="Basic"
            description="Access our most popular features for daily generations."
            price={9}
            computeUnits="5,000"
            features={[
              "Commercial license",
              "Full access to Image, 3D, and Lipsync models",
              "LoRA fine-tuning with up to 50 images",
              "Upscale & enhance to 4K",
              "Access to selected video models",
              "See all features...",
            ]}
            cta="Get Basic"
          />

          {/* Pro Card */}
          <PricingCard
            name="Pro"
            description="Full access to the world's best models & all our industry-leading tools."
            price={35}
            computeUnits="20,000"
            badge="Most popular"
            features={[
              "Everything in Basic plus",
              "Access to all video models",
              "Workflow automation with Nodes and Apps",
              "AI-powered Nodes Agent",
              "Bulk discounts on compute unit packs",
              "Upscale & enhance to 8K",
              "See all features...",
            ]}
            cta="Get Pro"
          />

          {/* Max Card */}
          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "16px",
              padding: isMobile ? "20px 18px" : "28px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div>
              <h4 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, margin: "0 0 8px 0", color: "#fff" }}>
                Max
              </h4>
              <p style={{ fontSize: isMobile ? "13px" : "14px", color: "#999", margin: 0, lineHeight: 1.5 }}>
                Maximum power for serious creators with unlimited concurrency, relaxed generations,
                and premium upscaling.
              </p>
            </div>

            {/* Price */}
            <div style={{ paddingTop: "16px", borderTop: "1px solid #333" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px" }}>
                <span style={{ fontSize: isMobile ? "32px" : "40px", fontWeight: 700, color: "#fff" }}>
                  $<AnimatedPrice value={maxPrice} />
                </span>
                <span style={{ fontSize: isMobile ? "13px" : "14px", color: "#999" }}>/mo</span>
              </div>
              <p style={{ fontSize: isMobile ? "12px" : "13px", color: "#666", margin: 0 }}>billed monthly</p>
            </div>

            {/* CTA */}
            <button
              style={{
                width: "100%",
                padding: isMobile ? "12px 20px" : "14px 24px",
                background: "#fff",
                color: "#000",
                border: "none",
                borderRadius: "999px",
                fontSize: isMobile ? "14px" : "15px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
                e.currentTarget.style.transform = "scale(1.01)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Get Max <span>→</span>
            </button>

            {/* Compute Units with Slider */}
            <div style={{ paddingTop: "16px", borderTop: "1px solid #333" }}>
              <p style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 600, color: "#fff", margin: "0 0 16px 0" }}>
                {maxSliderValue.toLocaleString()},000 compute units
              </p>

              {/* Slider */}
              <div style={{ position: "relative", marginBottom: "8px" }}>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="20"
                  value={maxSliderValue}
                  onChange={(e) => setMaxSliderValue(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: "6px",
                    background: `linear-gradient(to right, #fff 0%, #fff ${((maxSliderValue - 40) / 60) * 100}%, #333 ${((maxSliderValue - 40) / 60) * 100}%, #333 100%)`,
                    borderRadius: "3px",
                    outline: "none",
                    cursor: "pointer",
                    WebkitAppearance: "none",
                  }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #fff;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #fff;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  }
                `}</style>
              </div>

              {/* Slider Labels */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                {[40, 60, 80, 100].map((val) => (
                  <span
                    key={val}
                    style={{
                      fontSize: isMobile ? "11px" : "12px",
                      color: maxSliderValue === val ? "#fff" : "#666",
                      fontWeight: maxSliderValue === val ? 600 : 400,
                      transition: "color 0.2s ease",
                    }}
                  >
                    {val}k
                  </span>
                ))}
              </div>
            </div>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>↓</span>
                <span style={{ fontSize: isMobile ? "12px" : "13px", color: "#666", lineHeight: 1.4 }}>
                  Everything in Pro plus
                </span>
              </div>
              {[
                "Unlimited LoRA fine-tunings with 2,000 files",
                "Unlimited Concurrency",
                "Unlimited relaxed generations",
                "Upscale & enhance to 22K",
              ].map((feature, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "16px", color: "#4ade80" }}>✓</span>
                  <span style={{ fontSize: isMobile ? "12px" : "13px", color: "#ddd", lineHeight: 1.4 }}>{feature}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>↓</span>
                <span style={{ fontSize: isMobile ? "12px" : "13px", color: "#666", lineHeight: 1.4 }}>
                  See all features...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Pricing Card Component - Memoized
const PricingCard = React.memo(({
  name,
  description,
  price,
  computeUnits,
  badge,
  features,
  cta,
}: {
  name: string;
  description: string;
  price: number;
  computeUnits: string;
  badge?: string;
  features: string[];
  cta: string;
}) => {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "16px",
        padding: isMobile ? "20px 18px" : "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        transition: "all 0.3s ease",
        transform: !isMobile && hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: !isMobile && hovered ? "0 12px 40px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
          <h4 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, margin: 0, color: "#fff" }}>{name}</h4>
          {badge && (
            <span
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#fff",
                fontSize: isMobile ? "10px" : "11px",
                fontWeight: 600,
                padding: isMobile ? "3px 8px" : "4px 10px",
                borderRadius: "999px",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <p style={{ fontSize: isMobile ? "13px" : "14px", color: "#999", margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>

      {/* Price */}
      <div style={{ paddingTop: "16px", borderTop: "1px solid #333" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px" }}>
          <span style={{ fontSize: isMobile ? "32px" : "40px", fontWeight: 700, color: "#fff" }}>${price}</span>
          <span style={{ fontSize: isMobile ? "13px" : "14px", color: "#999" }}>/mo</span>
        </div>
        <p style={{ fontSize: isMobile ? "12px" : "13px", color: "#666", margin: 0 }}>billed monthly</p>
      </div>

      {/* CTA */}
      <button
        style={{
          width: "100%",
          padding: isMobile ? "12px 20px" : "14px 24px",
          background: "#fff",
          color: "#000",
          border: "none",
          borderRadius: "999px",
          fontSize: isMobile ? "14px" : "15px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f5f5f5";
          e.currentTarget.style.transform = "scale(1.01)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {cta} <span>→</span>
      </button>

      {/* Compute Units */}
      <div style={{ paddingTop: "16px", borderTop: "1px solid #333" }}>
        <p style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 600, color: "#fff", margin: "0 0 4px 0" }}>
          {computeUnits} compute units
        </p>
        <p style={{ fontSize: isMobile ? "11px" : "12px", color: "#666", margin: 0 }}>per month</p>
      </div>

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {features.map((feature, idx) => (
          <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            {feature.includes("See all") ? (
              <span style={{ fontSize: "12px", color: "#666" }}>↓</span>
            ) : (
              <span style={{ fontSize: "16px", color: "#4ade80" }}>✓</span>
            )}
            <span
              style={{
                fontSize: isMobile ? "12px" : "13px",
                color: feature.includes("See all") ? "#666" : "#ddd",
                lineHeight: 1.4,
              }}
            >
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
PricingCard.displayName = "PricingCard";

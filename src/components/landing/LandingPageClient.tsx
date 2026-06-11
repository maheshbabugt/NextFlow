"use client";

// Landing Page Client Component
// First page users see - showcases AI models with carousel
// Features: image/video carousel, auth modal, sticky header with logo
// Handles user authentication state and redirects to dashboard if logged in
// Mobile responsive: sticky header, full-width carousel, stacked layout

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AuthModal } from "../auth/AuthModal";

const carouselItems = [
  {
    id: 1,
    model: "Galaxy 1",
    modelIcon: "✦",
    prompt: "Cinematic photo of a person in a linen jacket",
    type: "image" as const,
    src: "/images/0_node.png",
    bg: "linear-gradient(160deg,#1a1008 0%,#0d0d0d 60%)",
  },
  {
    id: 2,
    model: "Veo 3",
    modelIcon: "◎",
    prompt: "An animated capybara talking about Galaxy.ai",
    type: "video" as const,
    src: "/videos/vid_2.mp4",
    bg: "linear-gradient(160deg,#0e2010 0%,#111 60%)",
  },
  {
    id: 3,
    model: "Topaz Upscaler",
    modelIcon: "⊹",
    prompt: "Upscale image 512px → 8K",
    type: "image" as const,
    src: "/images/1_node.png",
    bg: "linear-gradient(160deg,#0a0a18 0%,#0d0d0d 60%)",
  },
  {
    id: 4,
    model: "Hailuo",
    modelIcon: "◉",
    prompt: "Advertising sandwich with exploding layers",
    type: "video" as const,
    src: "/videos/vid_3.mp4",
    bg: "linear-gradient(160deg,#180a08 0%,#0d0d0d 60%)",
  },
  {
    id: 5,
    model: "Flux",
    modelIcon: "△",
    prompt: "Hyperrealistic portrait in golden hour light",
    type: "image" as const,
    src: "/images/2_node.png",
    bg: "linear-gradient(160deg,#101008 0%,#0d0d0d 60%)",
  },
];

const companiesRow = [
  { name: "Galaxy 1", icon: "✦" },
  { name: "Veo 3.1", icon: "◎" },
  { name: "Ideogram", icon: "❋" },
  { name: "Runway", icon: "ℝ" },
  { name: "Luma", icon: "◆" },
  { name: "Flux", icon: "△" },
  { name: "Gemini", icon: "✧" },
  { name: "Kling", icon: "⌘" },
  { name: "Stable Diffusion", icon: "⊛" },
  { name: "Pika", icon: "⚡" },
  { name: "Sora", icon: "○" },
  { name: "Midjourney", icon: "◈" },
];
const changingWords = ["Image", "Video", "3D", "Generative"];

export function LandingPageClient() {
  const [activeWord, setActiveWord] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signUp" | "signIn">("signUp");
  // true = user has signed in at least once before on this browser
  const [hasVisited, setHasVisited] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(
      () => setActiveWord((w) => (w + 1) % changingWords.length),
      2200,
    );
    return () => clearInterval(t);
  }, []);

  // Read the "has visited" flag from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasVisited(!!localStorage.getItem("nf_has_visited"));
    }
  }, []);

  // When Clerk confirms the user is signed in:
  // 1. Mark them as a returning user for future visits
  // 2. Redirect to dashboard
  useEffect(() => {
    if (isLoaded && userId) {
      localStorage.setItem("nf_has_visited", "1");
      router.replace("/dashboard");
    }
  }, [isLoaded, userId, router]);

  // Derived button state — only computed after Clerk has loaded
  // to avoid a flash of the wrong button
  const buttonState: "authenticated" | "returning" | "new" = !isLoaded
    ? "new" // show nothing meaningful until loaded
    : userId
      ? "authenticated"
      : hasVisited
        ? "returning"
        : "new";

  const prev = () =>
    setCarouselIdx(
      (i) => (i - 1 + carouselItems.length) % carouselItems.length,
    );
  const next = () => setCarouselIdx((i) => (i + 1) % carouselItems.length);
  const visible = [0, 1, 2].map(
    (o) => carouselItems[(carouselIdx + o) % carouselItems.length],
  );

  useEffect(() => {
    const videos = Array.from(
      document.querySelectorAll<HTMLVideoElement>(".landing-carousel"),
    );

    const cleanupHandlers: Array<() => void> = [];

    videos.forEach((video) => {
      video.defaultMuted = true;
      video.muted = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const handleInteraction = () => {
            video.play().catch(() => {});
          };

          window.addEventListener("click", handleInteraction, { once: true });
          window.addEventListener("scroll", handleInteraction, { once: true });

          cleanupHandlers.push(() => {
            window.removeEventListener("click", handleInteraction);
            window.removeEventListener("scroll", handleInteraction);
          });
        });
      }
    });

    return () => {
      cleanupHandlers.forEach((cleanup) => cleanup());
    };
  }, [carouselIdx]);

  const handleSignUp = () => {
    if (userId) {
      router.push("/dashboard");
    } else {
      setAuthMode("signUp");
      setAuthModalOpen(true);
    }
  };

  const handleLogIn = () => {
    if (userId) {
      router.push("/dashboard");
    } else {
      setAuthMode("signIn");
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <style>{`
        .page-root{scroll-snap-type:y mandatory;overflow-y:scroll;height:100vh;background:#050505}
        .snap-section{scroll-snap-align:start}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .marquee-track{animation:marquee 28s linear infinite;display:flex;width:max-content}
        .marquee-track:hover{animation-play-state:paused}
        @keyframes wordIn{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:translateY(0)}}
        .word-animate{animation:wordIn 0.45s cubic-bezier(0.22,1,0.36,1) both}
        .cc{transition:transform 0.3s ease;cursor:pointer;position:relative;overflow:hidden;border-radius:20px}
        .cc:hover{transform:translateY(-4px)}
        .co{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:20px;background:linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 55%)}
        .cb{opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s}
        .cc:hover .cb{opacity:1;transform:translateY(0)}
        .cp{transition:transform .25s}.cc:hover .cp{transform:translateY(-4px)}
        .bc{transition:transform .2s,box-shadow .2s;border-radius:16px;overflow:hidden}
        .bc:hover{transform:scale(1.015);box-shadow:0 8px 32px rgba(0,0,0,.18)}
        @keyframes speedLine{0%{transform:scaleX(0) translateX(-100%);opacity:0}40%{opacity:1}100%{transform:scaleX(1) translateX(0);opacity:.6}}
        .sl{animation:speedLine 1.8s ease-out infinite;transform-origin:left center}
        @keyframes bar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
        .ab{animation:bar 1.1s ease-in-out infinite;transform-origin:bottom}
        
        /* Mobile Header Styles */
        .sticky-header{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(0,0,0,0.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;align-items:center;padding:12px 16px;transition:all 0.3s ease}
        .header-logo{display:flex;align-items:center;gap:8px}
        .header-logo svg{width:20px;height:20px}
        .header-logo span{color:#fff;font-weight:700;font-size:16px;letter-spacing:-0.02em}
        .header-buttons{display:flex;gap:8px;align-items:center}
        .header-btn{padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all 0.2s ease;white-space:nowrap}
        .header-btn-signup{background-color:#fff;color:#000}
        .header-btn-signup:active{opacity:0.85}
        .header-btn-login{background-color:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2)}
        .header-btn-login:active{background-color:rgba(255,255,255,0.2)}
        .hamburger{display:none;width:24px;height:24px;flex-direction:column;justify-content:space-around;background:none;border:none;cursor:pointer;padding:0}
        .hamburger span{width:100%;height:2px;background:#fff;border-radius:1px;transition:all 0.3s ease}
        
        /* Carousel Styles */
        .carousel-container{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:24px}
        .carousel-card{height:460px;border-radius:20px;position:relative;overflow:hidden;cursor:pointer;transition:transform 0.3s ease}
        .carousel-wrapper{width:100%;max-width:1200px;padding:0 16px}
        
        /* Desktop Header */
        @media (min-width:768px){
          .sticky-header{position:relative;background:transparent;backdrop-filter:none;border:none;padding:22px 48px}
          .header-buttons{gap:10px}
          .header-btn{padding:10px 22px;font-size:14px}
          .hamburger{display:none !important}
          .carousel-container{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
          .carousel-card{height:460px}
          .carousel-wrapper{padding:0 48px}
        }
        
        /* Mobile adjustments */
        @media (max-width:767px){
          .header-btn-signup{padding:8px 14px;font-size:12px}
          .header-btn-login{padding:8px 14px;font-size:12px}
          .carousel-container{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px;margin-bottom:24px}
          .carousel-card{flex-shrink:0;width:280px;height:380px;scroll-snap-align:start}
        }
      `}</style>

      <div className="page-root">
        {/* ── HERO ── */}
        <section
          className="snap-section"
          style={{
            height: "100vh",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            paddingTop: "60px",
          }}
        >
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <img
              src="/images/landing_page/image.png"
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom,rgba(0,0,0,.55) 0%,rgba(0,0,0,.2) 40%,rgba(0,0,0,.7) 100%)",
              }}
            />
          </div>

          {/* Sticky Header */}
          <header className="sticky-header">
            <div className="header-logo">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Galaxy.ai</span>
            </div>
            <div className="header-buttons">
              {buttonState === "authenticated" && (
                <button
                  className="header-btn header-btn-signup"
                  onClick={() => router.push("/dashboard")}
                >
                  Go to Dashboard
                </button>
              )}
              {buttonState === "returning" && (
                <button
                  className="header-btn header-btn-signup"
                  onClick={handleLogIn}
                >
                  Sign in
                </button>
              )}
              {buttonState === "new" && (
                <button
                  className="header-btn header-btn-signup"
                  onClick={handleSignUp}
                >
                  Sign up for free
                </button>
              )}
              <button className="hamburger">
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </header>
          <main
            style={{
              position: "relative",
              zIndex: 10,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 24px",
              marginTop: "-80px",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(42px,4.5vw,60px)",
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                maxWidth: "820px",
                color: "#fff",
                marginBottom: 22,
              }}
            >
              <span style={{ color: "rgba(255,255,255,.5)" }}>Galaxy.ai </span>
              is the world&apos;s most powerful creative AI suite.
            </h1>
            <p
              style={{
                fontSize: "clamp(16px,1.5vw,20px)",
                color: "rgba(255,255,255,.75)",
                marginBottom: 44,
              }}
            >
              Generate, enhance, and edit images, videos, or 3D meshes for free
              with AI.
            </p>
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {buttonState === "authenticated" ? (
                <button
                  onClick={() => router.push("/dashboard")}
                  style={{
                    padding: "14px 34px",
                    backgroundColor: "#fff",
                    color: "#000",
                    borderRadius: 999,
                    fontSize: 16,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
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
                  Go to Dashboard
                </button>
              ) : buttonState === "returning" ? (
                <>
                  <button
                    onClick={handleLogIn}
                    style={{
                      padding: "14px 34px",
                      backgroundColor: "#fff",
                      color: "#000",
                      borderRadius: 999,
                      fontSize: 16,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
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
                    Sign in
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    style={{
                      padding: "14px 34px",
                      backgroundColor: "rgba(255,255,255,.1)",
                      backdropFilter: "blur(10px)",
                      color: "#fff",
                      borderRadius: 999,
                      fontSize: 16,
                      fontWeight: 700,
                      border: "1px solid rgba(255,255,255,.15)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,.2)";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,.1)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    Launch App
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSignUp}
                    style={{
                      padding: "14px 34px",
                      backgroundColor: "#fff",
                      color: "#000",
                      borderRadius: 999,
                      fontSize: 16,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
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
                    Sign up for free
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    style={{
                      padding: "14px 34px",
                      backgroundColor: "rgba(255,255,255,.1)",
                      backdropFilter: "blur(10px)",
                      color: "#fff",
                      borderRadius: 999,
                      fontSize: 16,
                      fontWeight: 700,
                      border: "1px solid rgba(255,255,255,.15)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,.2)";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,.1)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    Launch App
                  </button>
                </>
              )}
            </div>
          </main>
        </section>

        {/* ── CAROUSEL ── */}
        <section
          className="snap-section"
          style={{
            minHeight: "100vh",
            backgroundColor: "#fff",
            padding: "100px 0 80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1200,
              padding: "0 48px",
              marginBottom: 48,
            }}
          >
            <h2
              style={{
                fontSize: "clamp(36px,4.5vw,60px)",
                fontWeight: 800,
                color: "#000",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              The industry&apos;s best{" "}
              <span
                key={activeWord}
                className="word-animate"
                style={{ display: "inline-block" }}
              >
                {changingWords[activeWord]}
              </span>{" "}
              models.
              <br />
              In one subscription.
            </h2>
          </div>
          <div
            style={{
              width: "100%",
              overflow: "hidden",
              marginBottom: 72,
              padding: "12px 0",
              borderTop: "1px solid #eee",
              borderBottom: "1px solid #eee",
            }}
          >
            <div className="marquee-track" ref={marqueeRef}>
              {[...companiesRow, ...companiesRow].map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 36px",
                    color: "#999",
                    fontSize: 15,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}
            className="carousel-wrapper"
          >
            <div className="carousel-container">
              {visible.map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className="carousel-card cc"
                  style={{ background: item.bg }}
                >
                  {item.type === "image" && (
                    <img
                      src={item.src}
                      alt=""
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}

                  {item.type === "video" && (
                    <video
                      className="landing-carousel"
                      src={item.src}
                      muted
                      loop
                      playsInline
                      preload="auto"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 90, opacity: 0.06 }}>
                      {item.modelIcon}
                    </span>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(0,0,0,.55)",
                      backdropFilter: "blur(8px)",
                      borderRadius: 999,
                      padding: "5px 12px",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#fff" }}>
                      {item.modelIcon}
                    </span>
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}
                    >
                      {item.model}
                    </span>
                  </div>
                  <div className="co">
                    <div className="cp">
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "rgba(255,255,255,.5)",
                          letterSpacing: "0.08em",
                          marginBottom: 6,
                          textTransform: "uppercase",
                        }}
                      >
                        Prompt
                      </div>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: "#fff",
                          lineHeight: 1.3,
                          marginBottom: 14,
                        }}
                      >
                        &ldquo;{item.prompt}&rdquo;
                      </div>
                    </div>
                    <button
                      className="cb"
                      style={{
                        padding: "9px 18px",
                        background: "rgba(20,20,20,.9)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {item.type === "video"
                        ? "Generate video"
                        : "Generate image"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              {[
                { l: "‹", f: prev },
                { l: "›", f: next },
              ].map(({ l, f }) => (
                <button
                  key={l}
                  onClick={f}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#f0f0f0",
                    border: "none",
                    fontSize: 20,
                    color: "#333",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#ddd")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#f0f0f0")
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </>
  );
}

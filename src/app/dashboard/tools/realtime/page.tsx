"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Upload, X, Loader2 } from "lucide-react";

export default function RealtimePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    "Describe this image in vivid detail, then suggest how to enhance it creatively."
  );
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          model: "openai/gpt-5.4-nano",
          userMessage: prompt,
          imageUrls: imageUrl ? [imageUrl] : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data.output);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", padding: isMobile ? "76px 16px 24px" : "40px 20px", gap: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 8 : 10, marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={isMobile ? 16 : 18} />
          </div>
          <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, margin: 0 }}>Realtime AI</h1>
        </div>
        <p style={{ color: "#666", fontSize: isMobile ? 13 : 14, margin: 0 }}>Upload an image and describe what you want — AI responds instantly</p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !imageUrl && fileRef.current?.click()}
        style={{
          width: "100%", maxWidth: 640, minHeight: isMobile ? 220 : 280,
          border: `2px dashed ${imageUrl ? "#333" : "#2a2a2a"}`,
          borderRadius: 20, background: "#111",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: imageUrl ? "default" : "pointer",
          position: "relative", overflow: "hidden",
        }}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="uploaded" style={{ width: "100%", objectFit: "contain", maxHeight: isMobile ? 320 : 400 }} />
            <button
              onClick={(e) => { e.stopPropagation(); setImageUrl(null); setResult(null); }}
              style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", padding: 6, display: "flex" }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#444", padding: isMobile ? "16px" : "0" }}>
            <Upload size={isMobile ? 28 : 32} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: isMobile ? 13 : 14 }}>Drop an image here or click to upload</p>
            <p style={{ margin: "4px 0 0", fontSize: isMobile ? 11 : 12, color: "#333" }}>PNG, JPG, WEBP supported</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      <div style={{ width: "100%", maxWidth: 640, background: "#111", borderRadius: 16, padding: isMobile ? 14 : 16, border: "1px solid #1e1e1e" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe what you want the AI to do..."
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#ddd", fontSize: isMobile ? 13 : 14, resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: isMobile ? "9px 16px" : "10px 20px", borderRadius: 10, border: "none",
              background: loading || !prompt.trim() ? "#1a1a1a" : "linear-gradient(135deg,#ef4444,#f97316)",
              color: loading || !prompt.trim() ? "#444" : "#fff",
              fontWeight: 600, fontSize: isMobile ? 13 : 14, cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
              : <><Sparkles size={14} /> Generate</>}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ width: "100%", maxWidth: 640, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 16, color: "#ef4444", fontSize: isMobile ? 13 : 14 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ width: "100%", maxWidth: 640, background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: isMobile ? 16 : 20 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Response</p>
          <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: "#ccc", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result}</p>
        </div>
      )}
    </div>
  );
}

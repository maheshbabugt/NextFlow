"use client";

import React, { useState, useRef, useEffect } from "react";
import { Wand2, Upload, X, Loader2, Plus } from "lucide-react";

const EDIT_PRESETS = [
  "Remove the background and make it transparent",
  "Make the lighting more dramatic and cinematic",
  "Change the color palette to warm sunset tones",
  "Add a professional studio look",
  "Describe what objects are in this image",
];

export default function EditPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
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

  const handleEdit = async () => {
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
          systemPrompt: "You are a professional image editing assistant. When given an image and editing instructions, describe exactly how to achieve the edit step by step, and what the result would look like.",
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
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 8 : 10, marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wand2 size={isMobile ? 16 : 18} />
          </div>
          <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, margin: 0 }}>Edit</h1>
          <span style={{ fontSize: 11, background: "#2563eb", padding: "3px 8px", borderRadius: 6 }}>✨ New</span>
        </div>
        <p style={{ color: "#666", fontSize: isMobile ? 13 : 14, margin: 0 }}>Describe your edit — AI tells you exactly how to achieve it</p>
      </div>

      <div style={{ width: "100%", maxWidth: 900, display: "flex", gap: isMobile ? 12 : 20, flexWrap: "wrap" }}>
        {/* Left — upload */}
        <div style={{ flex: isMobile ? "1 1 100%" : "1 1 380px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !imageUrl && fileRef.current?.click()}
            style={{
              minHeight: isMobile ? 240 : 300, border: `2px dashed ${imageUrl ? "#333" : "#2a2a2a"}`,
              borderRadius: 20, background: "#111",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: imageUrl ? "default" : "pointer",
              position: "relative", overflow: "hidden",
            }}
          >
            {imageUrl ? (
              <>
                <img src={imageUrl} alt="uploaded" style={{ width: "100%", objectFit: "contain", maxHeight: isMobile ? 280 : 360 }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setImageUrl(null); setResult(null); }}
                  style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", padding: 6, display: "flex" }}
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#444" }}>
                <Upload size={isMobile ? 28 : 32} style={{ marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: isMobile ? 13 : 14 }}>Drop image or click to upload</p>
                <button
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                  style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#1f2937", color: "#cfcfcf", cursor: "pointer", fontSize: 13 }}
                >
                  <Plus size={14} /> Upload image
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Presets */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick presets</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EDIT_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  style={{
                    padding: isMobile ? "4px 8px" : "5px 10px", borderRadius: 8, border: "1px solid #222",
                    background: prompt === p ? "rgba(124,58,237,0.15)" : "#111",
                    color: prompt === p ? "#a78bfa" : "#666",
                    fontSize: isMobile ? 11 : 12, cursor: "pointer",
                    borderColor: prompt === p ? "rgba(124,58,237,0.3)" : "#222",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — prompt + result */}
        <div style={{ flex: isMobile ? "1 1 100%" : "1 1 380px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #1e1e1e" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Edit instructions</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe the edit you want to make..."
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#ddd", fontSize: isMobile ? 13 : 14, resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={handleEdit}
                disabled={loading || !prompt.trim()}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: loading || !prompt.trim() ? "#1a1a1a" : "linear-gradient(135deg,#7c3aed,#a855f7)",
                  color: loading || !prompt.trim() ? "#444" : "#fff",
                  fontWeight: 600, fontSize: isMobile ? 13 : 14, cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
                }}
              >
                {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Processing…</> : <><Wand2 size={14} /> Apply Edit</>}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 16, color: "#ef4444", fontSize: isMobile ? 13 : 14 }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: 20, flex: 1 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Edit Guide</p>
              <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: "#ccc", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result}</p>
            </div>
          )}

          {!result && !error && (
            <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: 32, textAlign: "center", color: "#333", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Wand2 size={isMobile ? 24 : 28} />
              <p style={{ margin: 0, fontSize: isMobile ? 12 : 13 }}>AI edit instructions will appear here</p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

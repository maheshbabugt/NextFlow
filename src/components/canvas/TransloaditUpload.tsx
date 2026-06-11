/**
 * src/components/canvas/TransloaditUpload.tsx
 *
 * Minimal headless Uppy + Transloadit upload component.
 * No Dashboard UI — renders a styled drop zone that fits inside a node.
 *
 * On success it calls onUpload(ssl_url) with the permanent Transloadit URL.
 *
 * Usage:
 *   <TransloaditUpload
 *     accept="image/*"
 *     onUpload={(url) => updateNodeData(id, { imageUrl: url })}
 *   />
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Uppy from "@uppy/core";
import Transloadit from "@uppy/transloadit";
import { Upload, Loader2 } from "lucide-react";

const TEMPLATE_ID = "a6565dbca12749daaae1dbd70771a3cf";

interface Props {
  /** "image/*" or "video/*" */
  accept: "image/*" | "video/*";
  /** Called with the Transloadit ssl_url on successful upload */
  onUpload: (url: string) => void;
}

export default function TransloaditUpload({ accept, onUpload }: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // One Uppy instance per component mount — recreated if accept changes
  const uppyRef = useRef<Uppy | null>(null);

  useEffect(() => {
    const uppy = new Uppy({
      autoProceed: true,           // start upload immediately on file add
      allowMultipleUploadBatches: false,
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: [accept],
      },
    }).use(Transloadit, {
      assemblyOptions: {
        params: {
          auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY ?? "" },
          template_id: TEMPLATE_ID,
        },
      },
      waitForEncoding: true,       // wait for assembly to finish
    });

    uppy.on("upload", () => setStatus("uploading"));

    uppy.on("transloadit:complete", (assembly) => {
      // Log the full assembly so we can see the exact result structure
      console.log("[Transloadit] assembly results keys:", Object.keys(assembly.results ?? {}));
      console.log("[Transloadit] full results:", JSON.stringify(assembly.results, null, 2));

      // /upload/handle robot puts files in uploads[], not results{}
      // Try results first, then uploads as fallback
      const resultMap = assembly.results ?? {};
      const resultCandidates =
        resultMap[":original"] ??
        resultMap["original"] ??
        resultMap["upload"] ??
        Object.values(resultMap)[0];

      const fromResults: string | undefined = Array.isArray(resultCandidates) && resultCandidates.length > 0
        ? (resultCandidates[0]?.ssl_url ?? undefined)
        : undefined;

      const uploads = (assembly as unknown as { uploads?: { ssl_url?: string }[] }).uploads ?? [];
      const fromUploads: string | undefined = uploads.length > 0 ? (uploads[0]?.ssl_url ?? undefined) : undefined;

      const url = fromResults ?? fromUploads;

      if (url) {
        setStatus("idle");
        onUpload(url);
        uppy.clear();
      } else {
        setStatus("error");
        setErrorMsg("Upload succeeded but no URL returned. Check template.");
        console.error("[Transloadit] No ssl_url found. Full assembly:", assembly);
      }
    });

    uppy.on("error", (err) => {
      setStatus("error");
      setErrorMsg(err?.message ?? "Upload failed");
    });

    uppyRef.current = uppy;
    return () => { uppy.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accept]);

  function handleFiles(files: FileList | null) {
    if (!files?.length || !uppyRef.current) return;
    setStatus("idle");
    setErrorMsg("");
    try {
      uppyRef.current.clear();
      uppyRef.current.addFile({
        name: files[0].name,
        type: files[0].type,
        data: files[0],
      });
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Could not add file");
    }
  }

  return (
    <div onMouseDown={(e) => e.stopPropagation()}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Drop zone */}
      <div
        onClick={() => status !== "uploading" && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          marginTop: 8,
          height: 72,
          borderRadius: 7,
          border: `1px dashed ${status === "error" ? "#ef4444" : "#3a3a3a"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          cursor: status === "uploading" ? "not-allowed" : "pointer",
          background: "#181818",
          transition: "border-color 0.15s ease",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (status !== "uploading")
            (e.currentTarget as HTMLDivElement).style.borderColor = "#555";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            status === "error" ? "#ef4444" : "#3a3a3a";
        }}
      >
        {status === "uploading" ? (
          <>
            <Loader2
              size={16}
              color="#8b5cf6"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span style={{ fontSize: 10, color: "#666" }}>Uploading…</span>
          </>
        ) : (
          <>
            <Upload size={14} color="#555" />
            <span style={{ fontSize: 10, color: "#555" }}>
              Click or drop to upload
            </span>
          </>
        )}
      </div>

      {/* Error message */}
      {status === "error" && errorMsg && (
        <div
          style={{
            marginTop: 5,
            fontSize: 10,
            color: "#ef4444",
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}

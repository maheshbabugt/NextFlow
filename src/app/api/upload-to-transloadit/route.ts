/**
 * src/app/api/upload-to-transloadit/route.ts
 *
 * POST /api/upload-to-transloadit
 *
 * Accepts a base64 PNG data URL, uploads it to Transloadit as a raw file,
 * and returns the permanent ssl_url from the assembly result.
 *
 * Uses the /upload/handle robot (your template a6565dbca12749daaae1dbd70771a3cf)
 * which just stores the original file and returns its URL.
 *
 * Body: { dataUrl: string }   — data:image/png;base64,...
 * Returns: { url: string }    — https://uploads.transloadit.com/...
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const TRANSLOADIT_KEY    = process.env.TRANSLOADIT_KEY    ?? process.env.NEXT_PUBLIC_TRANSLOADIT_KEY ?? "";
const TRANSLOADIT_SECRET = process.env.TRANSLOADIT_SECRET ?? "";
const TEMPLATE_ID        = "a6565dbca12749daaae1dbd70771a3cf";

export async function POST(req: NextRequest) {
  if (!TRANSLOADIT_KEY || !TRANSLOADIT_SECRET) {
    return NextResponse.json(
      { error: "TRANSLOADIT_KEY / TRANSLOADIT_SECRET not set in .env.local" },
      { status: 503 },
    );
  }

  const { dataUrl } = await req.json() as { dataUrl: string };
  if (!dataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "dataUrl must be a data:image/... string" }, { status: 400 });
  }

  // ── Convert base64 → Buffer ────────────────────────────────────────
  const base64Data = dataUrl.split(",")[1];
  const imageBuffer = Buffer.from(base64Data, "base64");

  // ── Build signed Transloadit params ───────────────────────────────
  const params = JSON.stringify({
    auth: {
      key:     TRANSLOADIT_KEY,
      expires: new Date(Date.now() + 5 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "+00:00"),
    },
    template_id: TEMPLATE_ID,
  });

  const signature = crypto
    .createHmac("sha384", TRANSLOADIT_SECRET)
    .update(Buffer.from(params, "utf-8"))
    .digest("hex");

  // ── POST multipart form to Transloadit ────────────────────────────
  const form = new FormData();
  form.append("params",    params);
  form.append("signature", `sha384:${signature}`);
  form.append(
    "file",
    new Blob([imageBuffer], { type: "image/png" }),
    `nextflow-${Date.now()}.png`,
  );

  const res = await fetch("https://api2.transloadit.com/assemblies", {
    method: "POST",
    body:   form,
    signal: AbortSignal.timeout(30_000),
  });

  const assembly = await res.json();

  if (!res.ok || assembly.error) {
    return NextResponse.json(
      { error: `Transloadit error: ${assembly.error ?? assembly.message ?? res.status}` },
      { status: 502 },
    );
  }

  // The /upload/handle robot stores files in assembly.uploads, not assembly.results
  // Try results first (for processing robots), then fall back to uploads
  const results  = assembly.results?.[":original"] ?? assembly.results?.original ?? [];
  const fromResults: string | undefined = Array.isArray(results) && results.length > 0
    ? results[0]?.ssl_url
    : undefined;

  const uploads = assembly.uploads ?? [];
  const fromUploads: string | undefined = Array.isArray(uploads) && uploads.length > 0
    ? uploads[0]?.ssl_url
    : undefined;

  const url = fromResults ?? fromUploads;

  if (!url) {
    return NextResponse.json(
      { error: "Assembly succeeded but no ssl_url found in results or uploads", assembly },
      { status: 502 },
    );
  }

  return NextResponse.json({ url });
}

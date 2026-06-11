/**
 * src/lib/uploadImage.ts
 *
 * Uploads a base64 data URL to Transloadit via /api/upload-to-transloadit
 * and returns a permanent public HTTPS ssl_url.
 *
 * Used by:
 *   - cropHandler.ts    (browser-side, after canvas crop)
 *   - extractHandler.ts (browser-side, after video frame capture)
 */
export async function uploadImage(dataUrl: string): Promise<string> {
  const res = await fetch("/api/upload-to-transloadit", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ dataUrl }),
  });

  const json = await res.json();

  if (!res.ok || !json.url) {
    throw new Error(
      json.error ?? `Upload failed (${res.status})`,
    );
  }

  return json.url as string;
}

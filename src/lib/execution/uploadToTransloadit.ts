/**
 * src/lib/execution/uploadToTransloadit.ts
 *
 * Browser-side Transloadit upload helper.
 * Takes a base64 data URL, uploads it to Transloadit, and returns the CDN URL.
 * Falls back to the original data URL if credentials are missing (local dev).
 *
 * Used by cropHandler and extractHandler so their outputs are real HTTPS URLs
 * that can be displayed, linked, and shared — not opaque base64 blobs.
 */

export async function uploadToTransloadit(dataUrl: string, prefix: string): Promise<string> {
  const key    = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY ?? "";
  const secret = ""; // secret is NOT available in the browser — use unsigned upload

  // In dev (no key) or if key is missing, return the base64 as-is
  if (!key) return dataUrl;

  const base64Data  = dataUrl.split(",")[1];
  if (!base64Data) return dataUrl;

  const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  // Unsigned Transloadit upload — uses template_id only, no HMAC needed
  // (template must have "allow_steps_override": false and no auth secret required)
  const params = JSON.stringify({
    auth: {
      key,
      // expires 5 minutes from now
      expires: new Date(Date.now() + 5 * 60 * 1000)
        .toISOString()
        .replace(/\.\d{3}Z$/, "+00:00"),
    },
    template_id: "a6565dbca12749daaae1dbd70771a3cf",
  });

  const form = new FormData();
  form.append("params", params);
  form.append(
    "file",
    new Blob([imageBuffer], { type: "image/png" }),
    `${prefix}-${Date.now()}.png`,
  );

  let res: Response;
  try {
    res = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    // Network error — fall back to base64
    return dataUrl;
  }

  if (!res.ok) return dataUrl;

  let assembly: Record<string, unknown>;
  try {
    assembly = await res.json();
  } catch {
    return dataUrl;
  }

  if (assembly.error) return dataUrl;

  // Extract the CDN URL from the assembly result
  const results = (assembly.results as Record<string, unknown[]> | undefined);
  const uploads = (assembly.uploads as unknown[] | undefined) ?? [];

  const fromResults =
    results?.[":original"]?.[0] as { ssl_url?: string } | undefined ??
    results?.["original"]?.[0]  as { ssl_url?: string } | undefined;

  const fromUploads = uploads[0] as { ssl_url?: string } | undefined;

  const url = fromResults?.ssl_url ?? fromUploads?.ssl_url;
  return url ?? dataUrl;
}

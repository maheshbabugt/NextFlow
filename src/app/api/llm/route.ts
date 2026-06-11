import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not set in .env.local" },
      { status: 500 },
    );
  }

  let body: {
    model?: string;
    systemPrompt?: string;
    userMessage?: string;
    imageUrls?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const model = body.model ?? "openai/gpt-4o-mini";
  const systemPrompt = body.systemPrompt?.trim() ?? "";
  const userMessage = body.userMessage?.trim() ?? "";
  const imageUrls: string[] = body.imageUrls ?? [];

  if (!userMessage && !systemPrompt) {
    return NextResponse.json(
      { error: "userMessage or systemPrompt is required" },
      { status: 400 },
    );
  }

  // Build messages array in standard OpenAI format
  const messages: { role: string; content: any }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  // Build user content — text only, or multimodal with images
  if (imageUrls.length > 0) {
    const contentParts: any[] = [];
    if (userMessage) {
      contentParts.push({ type: "text", text: userMessage });
    }
    for (const url of imageUrls) {
      // If it's a data URL, send inline; otherwise send as URL
      if (url.startsWith("data:")) {
        contentParts.push({
          type: "image_url",
          image_url: { url },
        });
      } else {
        // Fetch and convert to base64 to avoid CORS issues on the model side
        try {
          const imgRes = await fetch(url, { signal: AbortSignal.timeout(15_000) });
          if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            const mime = imgRes.headers.get("content-type") ?? "image/jpeg";
            const b64 = Buffer.from(buf).toString("base64");
            contentParts.push({
              type: "image_url",
              image_url: { url: `data:${mime};base64,${b64}` },
            });
          }
        } catch {
          // If image fetch fails, skip it silently
        }
      }
    }
    messages.push({ role: "user", content: contentParts });
  } else {
    messages.push({ role: "user", content: userMessage || systemPrompt });
  }

  try {
    // Call OpenRouter using the standard fetch API (avoids SDK format issues)
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "NextFlow",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message ?? data?.error ?? JSON.stringify(data);
      return NextResponse.json(
        { error: `OpenRouter error ${res.status}: ${errMsg}` },
        { status: 500 },
      );
    }

    const output: string = data.choices?.[0]?.message?.content ?? "";
    if (!output) {
      return NextResponse.json(
        { error: "OpenRouter returned empty response" },
        { status: 500 },
      );
    }

    return NextResponse.json({ output });
  } catch (err: any) {
    console.error("[/api/llm]", err);
    return NextResponse.json(
      { error: err.message ?? "OpenRouter request failed" },
      { status: 500 },
    );
  }
}

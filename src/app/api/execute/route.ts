import { NextRequest, NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { systemPrompt, userMessage } = body;

    // ✅ FIXED: Use OpenRouter with correct API structure
    const completion = await openRouter.chat.send({
      chatGenerationParams: {
        model: body.model ?? "openai/gpt-5.4-nano",
        messages: [
          ...(systemPrompt
            ? [{ role: "system" as const, content: systemPrompt }]
            : []),
          {
            role: "user" as const,
            content: userMessage,
          },
        ],
        maxTokens: 512,
      },
    } as any);

    return NextResponse.json({
      success: true,
      output: completion.choices?.[0]?.message?.content ?? "",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      success: false,
      error: "Execution failed",
    });
  }
}

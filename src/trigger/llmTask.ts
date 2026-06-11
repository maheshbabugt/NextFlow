import { task } from "@trigger.dev/sdk/v3";
import { OpenRouter } from "@openrouter/sdk";
import type { SystemMessage, UserMessage } from "@openrouter/sdk/models";
import type { LLMTaskPayload, LLMTaskResult } from "./types";

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const llmTask = task({
  id: "llm-node",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
    randomize: true,
  },

  run: async (payload: LLMTaskPayload): Promise<LLMTaskResult> => {
    const { model, systemPrompt, userMessage, imageUrls } = payload;

    const messages: Array<SystemMessage | UserMessage> = [];

    if (systemPrompt?.trim()) {
      messages.push({ role: "system", content: systemPrompt });
    }

    // Build user message — plain string or multimodal array
    const userMsg: UserMessage =
      imageUrls && imageUrls.length > 0
        ? {
            role: "user",
            content: [
              { type: "text", text: userMessage },
              ...imageUrls.map((url) => ({
                type: "image_url" as const,
                // SDK expects camelCase `imageUrl`, not `image_url`
                imageUrl: { url },
              })),
            ],
          }
        : { role: "user", content: userMessage };

    messages.push(userMsg);

    const completion = await openRouter.chat.send({
      chatGenerationParams: {
        model,
        messages,
        maxTokens: 512,
      },
    });

    // Non-streaming response
    const response = completion as Awaited<ReturnType<typeof openRouter.chat.send>> & {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const output = response.choices?.[0]?.message?.content ?? "";

    return { output, provider: "openrouter" };
  },
});

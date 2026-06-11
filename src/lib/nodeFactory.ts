/**
 * src/lib/nodeFactory.ts
 *
 * Given a NodeKind and a canvas position, returns a fully-formed
 * AnyFlowNode ready to be appended to the workflow store.
 *
 * Called by WorkflowCanvas.onDrop.
 */

import type { AnyFlowNode, NodeKind } from "@/types/nodes";

let _counter = 0;
const uid = (kind: string) => `${kind}-${++_counter}`;

export function createNode(
  kind: NodeKind,
  position: { x: number; y: number },
): AnyFlowNode {
  const id = uid(kind);

  switch (kind) {
    case "text":
      return {
        id,
        type: "text",
        position,
        data: { label: "Text", text: "" },
      };

    case "image":
      return {
        id,
        type: "image",
        position,
        data: { label: "Upload Image", imageUrl: "" },
      };

    case "video":
      return {
        id,
        type: "video",
        position,
        data: { label: "Upload Video", videoUrl: "" },
      };

    case "llm":
      return {
        id,
        type: "llm",
        position,
        data: {
          label: "Run LLM",
          model: "openai/gpt-5.4-nano",
          systemPrompt: "",
          userMessage: "",
          output: "",
          systemPromptConnected: false,
          userMessageConnected: false,
          imagesConnected: false,
        },
      };

    case "crop":
      return {
        id,
        type: "crop",
        position,
        data: {
          label: "Crop Image",
          imageUrl: "",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          imageUrlConnected: false,
        },
      };

    case "extract":
      return {
        id,
        type: "extract",
        position,
        data: {
          label: "Extract Frame",
          videoUrl: "",
          timestamp: "0",
          outputImageUrl: "",
          videoUrlConnected: false,
        },
      };
  }
}

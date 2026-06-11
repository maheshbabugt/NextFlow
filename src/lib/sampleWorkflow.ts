/**
 * src/lib/sampleWorkflow.ts
 *
 * Pre-built "Product Marketing Kit Generator" workflow.
 * Required by the assignment PDF — demonstrates ALL node types,
 * parallel execution, and convergence.
 *
 * ── Graph structure ───────────────────────────────────────────────────
 *
 *  BRANCH A (Image Processing + Product Description)
 *  ┌─────────────┐     ┌─────────────┐
 *  │ Upload Image│────▶│  Crop Image │──────────────────────────────┐
 *  └─────────────┘     └─────────────┘                              │
 *                                          images ──────────────────▼───┐
 *  ┌─────────────┐  system_prompt ────────────────────────────▶│       │
 *  │  Text #1    │                                              │ LLM#1 │──▶ user_message ─┐
 *  │ (sys prompt)│                                              │       │                   │
 *  └─────────────┘                                             └───────┘                   │
 *  ┌─────────────┐  user_message ─────────────────────────────▶│       │                   │
 *  │  Text #2    │                                                                          │
 *  │(prod details│                                                                          │
 *  └─────────────┘                                                                          │
 *                                                                                           │
 *  BRANCH B (Video Frame Extraction)                                                        │
 *  ┌─────────────┐     ┌─────────────┐                                                     │
 *  │ Upload Video│────▶│Extract Frame│──────────────────── images ──────────────┐           │
 *  └─────────────┘     └─────────────┘                                          │           │
 *                                                                                ▼           ▼
 *  ┌─────────────┐  system_prompt ────────────────────────────────────────▶ ┌───────────────┐
 *  │  Text #3    │                                                            │    LLM #2     │
 *  │(social mgr) │                                                            │ (convergence) │
 *  └─────────────┘                                                            └───────────────┘
 *
 * ── Execution phases (parallel) ─────────────────────────────────────
 *  Phase 1 (Wave 0): Upload Image, Upload Video, Text #1, Text #2, Text #3
 *  Phase 2 (Wave 1): Crop Image, Extract Frame
 *  Phase 3 (Wave 2): LLM Node #1
 *  Phase 4 (Wave 3): LLM Node #2 (convergence — waits for BOTH branches)
 */

import type { AnyFlowNode } from "@/types/nodes";
import type { Edge } from "@xyflow/react";

const EDGE_STYLE = {
  style: { stroke: "#8b5cf6", strokeWidth: 1.5 },
  animated: true,
};

export function buildSampleWorkflow(): {
  nodes: AnyFlowNode[];
  edges: Edge[];
} {
  /* ── Node positions — laid out left-to-right by phase ─────────── */

  // Phase 1 — source nodes (x: 80)
  const POS = {
    uploadImage: { x: 80, y: 60 },
    text1: { x: 80, y: 320 },
    text2: { x: 80, y: 520 },
    uploadVideo: { x: 80, y: 720 },
    text3: { x: 80, y: 960 },
    // Phase 2 (x: 420)
    cropImage: { x: 420, y: 60 },
    extractFrame: { x: 420, y: 720 },
    // Phase 3 (x: 760)
    llm1: { x: 760, y: 200 },
    // Phase 4 (x: 1140)
    llm2: { x: 1140, y: 440 },
  };

  /* ── Nodes ────────────────────────────────────────────────────── */
  const nodes: AnyFlowNode[] = [
    // Upload Image
    {
      id: "sample-img",
      type: "image",
      position: POS.uploadImage,
      data: {
        label: "Upload Image",
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      },
    },

    // Crop Image
    {
      id: "sample-crop",
      type: "crop",
      position: POS.cropImage,
      data: {
        label: "Crop Image",
        imageUrl: "",
        x: 10,
        y: 10,
        width: 80,
        height: 80,
        imageUrlConnected: true,
      },
    },

    // Text #1 — System Prompt for LLM #1
    {
      id: "sample-text1",
      type: "text",
      position: POS.text1,
      data: {
        label: "System Prompt",
        text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description.",
      },
    },

    // Text #2 — Product Details for LLM #1
    {
      id: "sample-text2",
      type: "text",
      position: POS.text2,
      data: {
        label: "Product Details",
        text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
      },
    },

    // LLM Node #1 — Product Description (Branch A convergence)
    {
      id: "sample-llm1",
      type: "llm",
      position: POS.llm1,
      data: {
        label: "LLM #1 — Product Description",
        model: "openai/gpt-5.4-nano",
        systemPrompt: "",
        userMessage: "",
        output: "",
        systemPromptConnected: true,
        userMessageConnected: true,
        imagesConnected: true,
      },
    },

    // Upload Video
    {
      id: "sample-video",
      type: "video",
      position: POS.uploadVideo,
      data: {
        label: "Upload Video",
        videoUrl: "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
      },
    },

    // Extract Frame
    {
      id: "sample-extract",
      type: "extract",
      position: POS.extractFrame,
      data: {
        label: "Extract Frame",
        videoUrl: "",
        timestamp: "50%",
        outputImageUrl: "",
        videoUrlConnected: true,
      },
    },

    // Text #3 — System Prompt for LLM #2
    {
      id: "sample-text3",
      type: "text",
      position: POS.text3,
      data: {
        label: "Social Media Prompt",
        text: "You are a social media manager. Create a tweet-length marketing post based on the product description and visual content.",
      },
    },

    // LLM Node #2 — Final Marketing Summary (convergence of both branches)
    {
      id: "sample-llm2",
      type: "llm",
      position: POS.llm2,
      data: {
        label: "LLM #2 — Marketing Summary",
        model: "openai/gpt-5.4-nano",
        systemPrompt: "",
        userMessage: "",
        output: "",
        systemPromptConnected: true,
        userMessageConnected: true,
        imagesConnected: true,
      },
    },
  ];

  /* ── Edges ────────────────────────────────────────────────────── */
  const edges: Edge[] = [
    // Branch A: Image → Crop
    {
      id: "e-img-crop",
      source: "sample-img",
      sourceHandle: "output",
      target: "sample-crop",
      targetHandle: "image_url",
      ...EDGE_STYLE,
    },

    // Branch A: Crop → LLM1 images
    {
      id: "e-crop-llm1-img",
      source: "sample-crop",
      sourceHandle: "output",
      target: "sample-llm1",
      targetHandle: "images",
      ...EDGE_STYLE,
    },

    // Text1 → LLM1 system_prompt
    {
      id: "e-text1-llm1",
      source: "sample-text1",
      sourceHandle: "output",
      target: "sample-llm1",
      targetHandle: "system_prompt",
      ...EDGE_STYLE,
    },

    // Text2 → LLM1 user_message
    {
      id: "e-text2-llm1",
      source: "sample-text2",
      sourceHandle: "output",
      target: "sample-llm1",
      targetHandle: "user_message",
      ...EDGE_STYLE,
    },

    // Branch B: Video → Extract
    {
      id: "e-video-extract",
      source: "sample-video",
      sourceHandle: "output",
      target: "sample-extract",
      targetHandle: "video_url",
      ...EDGE_STYLE,
    },

    // LLM1 output → LLM2 user_message (convergence point)
    {
      id: "e-llm1-llm2",
      source: "sample-llm1",
      sourceHandle: "output",
      target: "sample-llm2",
      targetHandle: "user_message",
      ...EDGE_STYLE,
    },

    // Extract → LLM2 images (Branch B joins LLM2)
    {
      id: "e-extract-llm2-img",
      source: "sample-extract",
      sourceHandle: "output",
      target: "sample-llm2",
      targetHandle: "images",
      ...EDGE_STYLE,
    },

    // Crop → LLM2 images (Branch A image also goes to LLM2)
    {
      id: "e-crop-llm2-img",
      source: "sample-crop",
      sourceHandle: "output",
      target: "sample-llm2",
      targetHandle: "images",
      ...EDGE_STYLE,
    },

    // Text3 → LLM2 system_prompt
    {
      id: "e-text3-llm2",
      source: "sample-text3",
      sourceHandle: "output",
      target: "sample-llm2",
      targetHandle: "system_prompt",
      ...EDGE_STYLE,
    },
  ];

  return { nodes, edges };
}

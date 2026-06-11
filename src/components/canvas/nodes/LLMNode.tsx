/**
 * src/components/canvas/nodes/LLMNode.tsx
 *
 * INPUT handles (left):
 *   system_prompt (top 30%), user_message (55%), images (80%)
 * OUTPUT handle (right): output
 */
"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import NodeShell, {
  FieldRow,
  NodeTextarea,
  NodeSelect,
  ConnectedBadge,
} from "../NodeShell";
import { useWorkflowStore } from "@/store/workflowStore";
import type { LLMNodeData } from "@/types/nodes";
import { MODEL_OPTIONS } from "@/lib/models";

function LLMNode({ id, data, selected }: NodeProps) {
  const d = data as LLMNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const status = useWorkflowStore((s) => s.nodeStatus[id]);
  const output = useWorkflowStore((s) => s.nodeOutputs[id]);

  return (
    <div style={{ position: "relative" }}>
      {/* INPUT handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="system_prompt"
        style={{ ...hs("#3b82f6"), top: "30%" }}
        title="System prompt"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="user_message"
        style={{ ...hs("#3b82f6"), top: "55%" }}
        title="User message"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="images"
        style={{ ...hs("#8b5cf6"), top: "78%" }}
        title="Images"
      />

      <NodeShell
        nodeId={id}
        kind="llm"
        label={d.label}
        selected={selected}
        minWidth={260}
      >
        <FieldRow label="Model">
          <NodeSelect
            value={d.model}
            onChange={(v) => updateNodeData(id, { model: v })}
            options={MODEL_OPTIONS}
          />
        </FieldRow>

        <FieldRow label="System prompt">
          {d.systemPromptConnected ? (
            <ConnectedBadge />
          ) : (
            <NodeTextarea
              value={d.systemPrompt}
              onChange={(v) => updateNodeData(id, { systemPrompt: v })}
              placeholder="You are a helpful assistant…"
              rows={2}
            />
          )}
        </FieldRow>

        <FieldRow label="User message *">
          {d.userMessageConnected ? (
            <ConnectedBadge />
          ) : (
            <NodeTextarea
              value={d.userMessage}
              onChange={(v) => updateNodeData(id, { userMessage: v })}
              placeholder="What would you like to ask?"
              rows={2}
            />
          )}
        </FieldRow>

        <FieldRow label="Images">
          {d.imagesConnected ? (
            <ConnectedBadge />
          ) : (
            <div
              style={{ fontSize: 11, color: "#3a3a3a", fontStyle: "italic" }}
            >
              Connect image nodes ↑
            </div>
          )}
        </FieldRow>
      </NodeShell>

      {/* OUTPUT handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={hs("#22c55e")}
        title="LLM text output"
      />
    </div>
  );
}

export default memo(LLMNode);
const hs = (c: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  background: c,
  border: "2px solid #0e0e0e",
  borderRadius: "50%",
});

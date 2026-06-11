/**
 * src/components/canvas/nodes/TextNode.tsx
 * Handles: output (right)
 */
"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import NodeShell, { FieldRow, NodeTextarea } from "../NodeShell";
import { useWorkflowStore } from "@/store/workflowStore";
import type { TextNodeData } from "@/types/nodes";

function TextNode({ id, data, selected }: NodeProps) {
  const d = data as TextNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const status = useWorkflowStore((s) => s.nodeStatus[id]);
  const output = useWorkflowStore((s) => s.nodeOutputs[id]);

  return (
    <div style={{ position: "relative" }}>
      <NodeShell nodeId={id} kind="text" label={d.label} selected={selected}>
        <FieldRow label="Text content">
          <NodeTextarea
            value={d.text}
            onChange={(v) => updateNodeData(id, { text: v })}
            placeholder="Type your text here…"
            rows={3}
          />
        </FieldRow>
      </NodeShell>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={hs("#3b82f6")}
        title="Text output"
      />
    </div>
  );
}

export default memo(TextNode);
const hs = (c: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  background: c,
  border: "2px solid #0e0e0e",
  borderRadius: "50%",
});

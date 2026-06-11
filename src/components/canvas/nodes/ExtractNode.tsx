/**
 * src/components/canvas/nodes/ExtractNode.tsx
 * INPUT handles: video_url, timestamp
 * OUTPUT handle: output (frame image URL / base64)
 */
"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import NodeShell, { FieldRow, NodeInput, ConnectedBadge } from "../NodeShell";
import { useWorkflowStore } from "@/store/workflowStore";
import type { ExtractNodeData } from "@/types/nodes";

function ExtractNode({ id, data, selected }: NodeProps) {
  const d = data as ExtractNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const upd = (patch: Partial<ExtractNodeData>) => updateNodeData(id, patch);

  return (
    <div style={{ position: "relative" }}>
      <Handle
        type="target"
        position={Position.Left}
        id="video_url"
        style={{ ...hs("#ec4899"), top: "35%" }}
        title="Video URL"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="timestamp"
        style={{ ...hs("#3b82f6"), top: "65%" }}
        title="Timestamp"
      />

      <NodeShell
        nodeId={id}
        kind="extract"
        label={d.label}
        selected={selected}
        minWidth={240}
      >
        <FieldRow label="Video URL">
          {d.videoUrlConnected ? (
            <ConnectedBadge />
          ) : (
            <NodeInput
              value={d.videoUrl}
              onChange={(v) => upd({ videoUrl: v })}
              placeholder="https://… mp4 / webm"
            />
          )}
        </FieldRow>
        <FieldRow label="Timestamp">
          <NodeInput
            value={d.timestamp}
            onChange={(v) => upd({ timestamp: v })}
            placeholder='5  (seconds)  or  "50%"'
          />
        </FieldRow>
      </NodeShell>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={hs("#06b6d4")}
        title="Extracted frame output"
      />
    </div>
  );
}

export default memo(ExtractNode);
const hs = (c: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  background: c,
  border: "2px solid #0e0e0e",
  borderRadius: "50%",
});

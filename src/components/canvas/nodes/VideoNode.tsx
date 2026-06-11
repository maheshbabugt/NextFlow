/**
 * src/components/canvas/nodes/VideoNode.tsx
 * OUTPUT handle → emits videoUrl (Transloadit ssl_url or manual URL)
 */
"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import NodeShell, { FieldRow, NodeInput } from "../NodeShell";
import TransloaditUpload from "../TransloaditUpload";
import { useWorkflowStore } from "@/store/workflowStore";
import type { VideoNodeData } from "@/types/nodes";

function VideoNode({ id, data, selected }: NodeProps) {
  const d = data as VideoNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const setNodeOutput  = useWorkflowStore((s) => s.setNodeOutput);
  const setNodeStatus  = useWorkflowStore((s) => s.setNodeStatus);

  function handleUpload(url: string) {
    updateNodeData(id, { videoUrl: url });
    setNodeOutput(id, url);
    setNodeStatus(id, "success");
  }

  return (
    <div style={{ position: "relative" }}>
      <NodeShell
        nodeId={id}
        kind="video"
        label={d.label}
        selected={selected}
        minWidth={250}
      >
        {/* Manual URL input */}
        <FieldRow label="Video URL">
          <NodeInput
            value={d.videoUrl}
            onChange={(v) => updateNodeData(id, { videoUrl: v })}
            placeholder="https://… or upload below"
          />
        </FieldRow>

        {/* Transloadit upload — sets videoUrl + output on success */}
        <TransloaditUpload
          accept="video/*"
          onUpload={handleUpload}
        />

        {/* Preview */}
        {d.videoUrl ? (
          <video
            src={d.videoUrl}
            controls
            muted
            style={{
              width: "100%",
              maxHeight: 100,
              borderRadius: 7,
              marginTop: 8,
              background: "#000",
              display: "block",
              border: "1px solid #2a2a2a",
            }}
          />
        ) : null}
      </NodeShell>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={hs("#ec4899")}
        title="Video URL output"
      />
    </div>
  );
}

export default memo(VideoNode);
const hs = (c: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  background: c,
  border: "2px solid #0e0e0e",
  borderRadius: "50%",
});

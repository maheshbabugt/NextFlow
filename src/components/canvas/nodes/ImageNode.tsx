/**
 * src/components/canvas/nodes/ImageNode.tsx
 * OUTPUT handle → emits imageUrl (Transloadit ssl_url or manual URL)
 */
"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import NodeShell, { FieldRow, NodeInput } from "../NodeShell";
import TransloaditUpload from "../TransloaditUpload";
import { useWorkflowStore } from "@/store/workflowStore";
import type { ImageNodeData } from "@/types/nodes";

function ImageNode({ id, data, selected }: NodeProps) {
  const d = data as ImageNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const setNodeOutput  = useWorkflowStore((s) => s.setNodeOutput);
  const setNodeStatus  = useWorkflowStore((s) => s.setNodeStatus);

  function handleUpload(url: string) {
    updateNodeData(id, { imageUrl: url });
    // Show URL in the output panel + mark node as success
    // so connected nodes can receive it via edges
    setNodeOutput(id, url);
    setNodeStatus(id, "success");
  }

  return (
    <div style={{ position: "relative" }}>
      <NodeShell
        nodeId={id}
        kind="image"
        label={d.label}
        selected={selected}
        minWidth={250}
      >
        {/* Manual URL input */}
        <FieldRow label="Image URL">
          <NodeInput
            value={d.imageUrl}
            onChange={(v) => updateNodeData(id, { imageUrl: v })}
            placeholder="https://… or upload below"
          />
        </FieldRow>

        {/* Transloadit upload — sets imageUrl + output on success */}
        <TransloaditUpload
          accept="image/*"
          onUpload={handleUpload}
        />

        {/* Preview */}
        {d.imageUrl ? (
          <div
            style={{
              marginTop: 8,
              borderRadius: 7,
              overflow: "hidden",
              border: "1px solid #2a2a2a",
            }}
          >
            <img
              src={d.imageUrl}
              alt="preview"
              style={{
                width: "100%",
                maxHeight: 120,
                objectFit: "cover",
                display: "block",
              }}
              onError={(e) =>
                ((e.currentTarget as HTMLImageElement).style.display = "none")
              }
            />
          </div>
        ) : null}
      </NodeShell>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={hs("#8b5cf6")}
        title="Image URL output"
      />
    </div>
  );
}

export default memo(ImageNode);
const hs = (c: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  background: c,
  border: "2px solid #0e0e0e",
  borderRadius: "50%",
});

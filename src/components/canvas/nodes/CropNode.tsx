/**
 * src/components/canvas/nodes/CropNode.tsx
 * 
 * Crop Image Node with dynamic, user-configurable parameters.
 * 
 * INPUT handles:
 *   - image_url (REQUIRED)
 *   - x_percent (OPTIONAL, default: 0)
 *   - y_percent (OPTIONAL, default: 0)
 *   - width_percent (OPTIONAL, default: 100)
 *   - height_percent (OPTIONAL, default: 100)
 * 
 * OUTPUT handle:
 *   - output (cropped image URL / base64)
 * 
 * Behavior:
 *   - If input handle is connected: use value from connected node
 *   - Else if manually entered: use manual value
 *   - Else: use default value
 *   - Manual inputs are disabled (greyed out) when connected
 */
"use client";

import { memo, useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import NodeShell, { FieldRow, NodeInput, ConnectedBadge } from "../NodeShell";
import { useWorkflowStore } from "@/store/workflowStore";
import type { CropNodeData } from "@/types/nodes";

function CropNode({ id, data, selected }: NodeProps) {
  const d = data as CropNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const upd = (patch: Partial<CropNodeData>) => updateNodeData(id, patch);

  // Local string state so the user can clear the field and type freely
  // without the value snapping back mid-edit (e.g. "|| 100" bug)
  const [xStr,  setXStr]  = useState(String(d.x      ?? 0));
  const [yStr,  setYStr]  = useState(String(d.y      ?? 0));
  const [wStr,  setWStr]  = useState(String(d.width  ?? 100));
  const [hStr,  setHStr]  = useState(String(d.height ?? 100));

  // Keep local strings in sync if the store value changes externally
  useEffect(() => { setXStr(String(d.x      ?? 0));   }, [d.x]);
  useEffect(() => { setYStr(String(d.y      ?? 0));   }, [d.y]);
  useEffect(() => { setWStr(String(d.width  ?? 100)); }, [d.width]);
  useEffect(() => { setHStr(String(d.height ?? 100)); }, [d.height]);

  const commitNum = (
    raw: string,
    key: "x" | "y" | "width" | "height",
    fallback: number,
  ) => {
    const n = raw === "" ? fallback : Number(raw);
    upd({ [key]: isNaN(n) ? fallback : n });
  };

  // Track which inputs are connected (will be set by edge connection logic)
  const xConnected = (d as any).xConnected ?? false;
  const yConnected = (d as any).yConnected ?? false;
  const widthConnected = (d as any).widthConnected ?? false;
  const heightConnected = (d as any).heightConnected ?? false;

  return (
    <div style={{ position: "relative" }}>
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="image_url"
        style={{ ...hs("#8b5cf6"), top: "18%" }}
        title="Image URL (required)"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="x_percent"
        style={{ ...hs("#3b82f6"), top: "36%" }}
        title="X % (0-100, default: 0)"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="y_percent"
        style={{ ...hs("#3b82f6"), top: "48%" }}
        title="Y % (0-100, default: 0)"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="width_percent"
        style={{ ...hs("#3b82f6"), top: "60%" }}
        title="Width % (1-100, default: 100)"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="height_percent"
        style={{ ...hs("#3b82f6"), top: "72%" }}
        title="Height % (1-100, default: 100)"
      />

      <NodeShell
        nodeId={id}
        kind="crop"
        label={d.label}
        selected={selected}
        minWidth={260}
      >
        {/* Image URL (required) */}
        <FieldRow label="Image URL">
          {d.imageUrlConnected ? (
            <ConnectedBadge />
          ) : (
            <NodeInput
              value={d.imageUrl}
              onChange={(v) => upd({ imageUrl: v })}
              placeholder="https://…"
            />
          )}
        </FieldRow>

        {/* Crop parameters in 2x2 grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          {/* X % */}
          <FieldRow label="X %">
            {xConnected ? (
              <ConnectedBadge />
            ) : (
              <NodeInput
                value={xStr}
                onChange={(v) => { setXStr(v); const n = Number(v); if (!isNaN(n)) upd({ x: n }); }}
                onBlur={() => commitNum(xStr, "x", 0)}
                placeholder="0"
                inputMode="numeric"
              />
            )}
          </FieldRow>

          {/* Y % */}
          <FieldRow label="Y %">
            {yConnected ? (
              <ConnectedBadge />
            ) : (
              <NodeInput
                value={yStr}
                onChange={(v) => { setYStr(v); const n = Number(v); if (!isNaN(n)) upd({ y: n }); }}
                onBlur={() => commitNum(yStr, "y", 0)}
                placeholder="0"
                inputMode="numeric"
              />
            )}
          </FieldRow>

          {/* Width % */}
          <FieldRow label="W %">
            {widthConnected ? (
              <ConnectedBadge />
            ) : (
              <NodeInput
                value={wStr}
                onChange={(v) => { setWStr(v); const n = Number(v); if (!isNaN(n)) upd({ width: n }); }}
                onBlur={() => commitNum(wStr, "width", 100)}
                placeholder="100"
                inputMode="numeric"
              />
            )}
          </FieldRow>

          {/* Height % */}
          <FieldRow label="H %">
            {heightConnected ? (
              <ConnectedBadge />
            ) : (
              <NodeInput
                value={hStr}
                onChange={(v) => { setHStr(v); const n = Number(v); if (!isNaN(n)) upd({ height: n }); }}
                onBlur={() => commitNum(hStr, "height", 100)}
                placeholder="100"
                inputMode="numeric"
              />
            )}
          </FieldRow>
        </div>

        {/* Info text */}
        <div
          style={{
            fontSize: 9,
            color: "#3a3a3a",
            marginTop: 6,
            lineHeight: 1.4,
          }}
        >
          All values in percentages (0-100). Connected inputs override manual values.
        </div>
      </NodeShell>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={hs("#f59e0b")}
        title="Cropped image output"
      />
    </div>
  );
}

export default memo(CropNode);
const hs = (c: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  background: c,
  border: "2px solid #0e0e0e",
  borderRadius: "50%",
});

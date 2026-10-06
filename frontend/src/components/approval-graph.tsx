"use client";
import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Approval, Discovery } from "@/lib/types";
const positions: Record<string, { x: number; y: number }> = {
  a1: { x: 360, y: 0 },
  a3: { x: 60, y: 150 },
  a2: { x: 360, y: 150 },
  a4: { x: 660, y: 150 },
  a5: { x: 930, y: 150 },
  a6: { x: 360, y: 300 },
  a12: { x: 360, y: 460 },
};
export default function ApprovalGraph({
  discovery,
  onSelect,
}: {
  discovery: Discovery;
  onSelect: (a: Approval) => void;
}) {
  const nodes: Node[] = useMemo(
    () =>
      discovery.approvals
        .filter((a) => positions[a.id])
        .map((a) => ({
          id: a.id,
          position: positions[a.id],
          data: {
            label: (
              <div className="flow-label">
                <span>
                  {a.department_id === "d1"
                    ? "MPCB"
                    : a.department_id === "d2"
                      ? "INDUSTRIAL SAFETY"
                      : a.department_id === "d3"
                        ? "FIRE DEPARTMENT"
                        : a.department_id === "d4"
                          ? "LABOUR DEPARTMENT"
                          : "LOCAL AUTHORITY"}
                </span>
                <strong>{a.name}</strong>
                <small>
                  {a.status === "Approved"
                    ? "Completed"
                    : a.status || "Required"}{" "}
                  <i /> {a.priority} priority
                </small>
              </div>
            ),
          },
          style: {
            width: 240,
            borderRadius: 8,
            border:
              a.status === "Approved"
                ? "1px solid #a8d8bc"
                : "1px solid #cad7e8",
            boxShadow: "0 4px 12px #102e5510",
            padding: 14,
            background: a.status === "Approved" ? "#f3fbf6" : "white",
          },
        })),
    [discovery],
  );
  const edges: Edge[] = discovery.dependencies
    .filter(
      (e) =>
        nodes.some((n) => n.id === e.source) &&
        nodes.some((n) => n.id === e.target),
    )
    .map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      animated: e.source === "a2",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#9bacbf" },
      style: { stroke: "#9bacbf", strokeWidth: 1.5 },
    }));
  return (
    <div className="graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.3}
        maxZoom={1.8}
        onNodeClick={(_, node) => {
          const a = discovery.approvals.find((a) => a.id === node.id);
          if (a) onSelect(a);
        }}
      >
        <Background gap={24} size={1} color="#d5deeb" />
        <Controls />
      </ReactFlow>
    </div>
  );
}

"use client";
/** Offline-only graph renderer for restricted environments. Normal installs use React Flow. */
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { Minus, Plus, Maximize } from "lucide-react";
export interface Node {
  id: string;
  position: { x: number; y: number };
  data: { label: ReactNode };
  style?: CSSProperties;
}
export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  markerEnd?: { type: string; color: string };
  style?: CSSProperties;
}
export const MarkerType = { ArrowClosed: "arrowclosed" };
const FlowContext = createContext<{
  zoom: number;
  setZoom: (n: number) => void;
  reset: () => void;
}>({ zoom: 1, setZoom: () => {}, reset: () => {} });
export function ReactFlow({
  nodes,
  edges,
  children,
  onNodeClick,
}: {
  nodes: Node[];
  edges: Edge[];
  children: ReactNode;
  fitView?: boolean;
  minZoom?: number;
  maxZoom?: number;
  onNodeClick?: (e: MouseEvent, node: Node) => void;
}) {
  const [zoom, setZoom] = useState(0.65);
  const [pan, setPan] = useState({ x: 40, y: 45 });
  const pointer = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
  } | null>(null);
  return (
    <FlowContext.Provider
      value={{
        zoom,
        setZoom,
        reset: () => {
          setZoom(0.65);
          setPan({ x: 40, y: 45 });
        },
      }}
    >
      <div
        className="offline-flow"
        onWheel={(e) => {
          setZoom((old) =>
            Math.max(0.3, Math.min(1.8, old + (e.deltaY < 0 ? 0.07 : -0.07))),
          );
        }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          pointer.current = {
            x: e.clientX,
            y: e.clientY,
            px: pan.x,
            py: pan.y,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const p = pointer.current;
          if (p)
            setPan({ x: p.px + e.clientX - p.x, y: p.py + e.clientY - p.y });
        }}
        onPointerUp={() => {
          pointer.current = null;
        }}
      >
        <div
          className="offline-flow-scene"
          style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg className="offline-flow-edges" width="1300" height="700">
            <defs>
              <marker
                id="flow-arrow"
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <path d="M0 0 L7 3.5 L0 7" fill="#9bacbf" />
              </marker>
            </defs>
            {edges.map((e) => {
              const s = nodes.find((n) => n.id === e.source);
              const t = nodes.find((n) => n.id === e.target);
              if (!s || !t) return null;
              const x1 = s.position.x + 120,
                y1 = s.position.y + 100,
                x2 = t.position.x + 120,
                y2 = t.position.y;
              return (
                <path
                  key={e.id}
                  d={`M${x1} ${y1} C${x1} ${(y1 + y2) / 2},${x2} ${(y1 + y2) / 2},${x2} ${y2}`}
                  stroke="#9bacbf"
                  strokeWidth="1.5"
                  fill="none"
                  markerEnd="url(#flow-arrow)"
                />
              );
            })}
          </svg>
          {nodes.map((n) => (
            <button
              key={n.id}
              className="offline-flow-node"
              style={{ ...n.style, left: n.position.x, top: n.position.y }}
              onClick={(e) => onNodeClick?.(e, n)}
            >
              {n.data.label}
            </button>
          ))}
        </div>
        {children}
        <span className="offline-flow-note">
          Offline graph fallback · Drag to pan · Scroll to zoom
        </span>
      </div>
    </FlowContext.Provider>
  );
}
export function Background(_props: {
  gap?: number;
  size?: number;
  color?: string;
}) {
  return null;
}
export function Controls() {
  const { zoom, setZoom, reset } = useContext(FlowContext);
  return (
    <div className="offline-flow-controls">
      <button
        aria-label="Zoom in"
        onClick={() => setZoom(Math.min(1.8, zoom + 0.15))}
      >
        <Plus size={16} />
      </button>
      <button
        aria-label="Zoom out"
        onClick={() => setZoom(Math.max(0.3, zoom - 0.15))}
      >
        <Minus size={16} />
      </button>
      <button aria-label="Fit graph" onClick={reset}>
        <Maximize size={15} />
      </button>
    </div>
  );
}

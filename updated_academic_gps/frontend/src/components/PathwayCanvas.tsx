import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { EdgePayload, PathRecord, PositionedNode } from "../types";

type Props = {
  path: PathRecord;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onViewportChange: (viewport: { zoom: number; pan: { x: number; y: number } }) => void;
  onSelect: (node: PositionedNode) => void;
  onExpand: (node: PositionedNode) => void;
  onOpenDetail: (node: PositionedNode) => void;
};

const WORLD_SIZE = 2400;
const WORLD_HALF = WORLD_SIZE / 2;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.6;

export function PathwayCanvas({
  path,
  zoom,
  pan,
  onPanChange,
  onViewportChange,
  onSelect,
  onExpand,
  onOpenDetail,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const clickTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeNode = path.nodes.find((node) => node.id === path.active_node_id) ?? path.nodes[0];
  const nodesById = useMemo(() => Object.fromEntries(path.nodes.map((node) => [node.id, node])), [path.nodes]);

  const visibleNodes = useMemo(
    () =>
      path.nodes.filter((node) => {
        if (node.id === activeNode.id) return true;
        if (node.visited) return true;
        return node.parent_id === activeNode.id;
      }),
    [path.nodes, activeNode.id]
  );
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const hoveredNode = visibleNodes.find((node) => node.id === hoveredId) ?? null;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStart.current) return;
    onPanChange({
      x: dragStart.current.panX + (event.clientX - dragStart.current.x),
      y: dragStart.current.panY + (event.clientY - dragStart.current.y)
    });
  };

  const stopDrag = () => {
    setDragging(false);
    dragStart.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pointerX = event.clientX - rect.left - rect.width / 2;
    const pointerY = event.clientY - rect.top - rect.height / 2;
    const zoomFactor = event.deltaY < 0 ? 1.08 : 0.92;
    const nextZoom = clamp(zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
    const worldX = (pointerX - pan.x) / zoom;
    const worldY = (pointerY - pan.y) / zoom;
    const nextPan = {
      x: pointerX - worldX * nextZoom,
      y: pointerY - worldY * nextZoom,
    };

    onViewportChange({ zoom: nextZoom, pan: nextPan });
  };

  const previewPosition = hoveredNode
    ? {
        left: `calc(50% + ${hoveredNode.x * zoom + pan.x + 96}px)`,
        top: `calc(50% + ${hoveredNode.y * zoom + pan.y - 34}px)`
      }
    : null;

  const handleNodeClick = (node: PositionedNode) => {
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    clickTimer.current = window.setTimeout(() => {
      onSelect(node);
      onOpenDetail(node);
      clickTimer.current = null;
    }, 180);
  };

  const handleNodeDoubleClick = (node: PositionedNode) => {
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    onExpand(node);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.05]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerLeave={stopDrag}
      onWheel={handleWheel}
    >
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-70" />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[2400px] w-[2400px]"
        animate={{ x: pan.x - WORLD_HALF, y: pan.y - WORLD_HALF, scale: zoom }}
        transition={dragging ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 24 }}
        style={{ transformOrigin: "center center" }}
      >
        <svg className="absolute inset-0 h-full w-full overflow-visible">
          {path.edges
            .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
            .map((edge) => (
              <Edge key={edge.id} edge={edge} source={nodesById[edge.source]} target={nodesById[edge.target]} activeNodeId={activeNode.id} />
            ))}
        </svg>

        <AnimatePresence>
          {visibleNodes.map((node, index) => {
            const active = node.id === activeNode.id;
            const childOption = node.parent_id === activeNode.id && !node.visited;
            const nodeRadius = active ? 108 : childOption ? 64 : 58;
            const ambientDelay = index * 0.08;

            return (
              <motion.button
                key={node.id}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 230, damping: 24 }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId((current) => (current === node.id ? null : current))}
                onClick={(event) => {
                  event.stopPropagation();
                  handleNodeClick(node);
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  handleNodeDoubleClick(node);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none ${
                  active ? "z-30" : hoveredId === node.id ? "z-20" : "z-10"
                }`}
                style={{ left: node.x + WORLD_HALF, top: node.y + WORLD_HALF, width: nodeRadius * 2, height: nodeRadius * 2 }}
              >
                <motion.div
                  animate={{
                    scale: active ? [1, 1.012, 1] : hoveredId === node.id ? 1.04 : [1, 1.008, 1],
                    y: active ? [0, -1.5, 0] : [0, -1, 0],
                    boxShadow: active
                      ? [
                          "0 0 0 1px rgba(125,211,252,0.34), 0 0 52px rgba(94,164,255,0.26)",
                          "0 0 0 1px rgba(125,211,252,0.42), 0 0 74px rgba(94,164,255,0.38)",
                          "0 0 0 1px rgba(125,211,252,0.34), 0 0 52px rgba(94,164,255,0.26)",
                        ]
                      : hoveredId === node.id
                        ? "0 0 0 1px rgba(255,255,255,0.18), 0 0 52px rgba(133,123,255,0.28)"
                        : [
                            "0 0 0 1px rgba(255,255,255,0.14), 0 18px 42px rgba(15,23,42,0.42)",
                            "0 0 0 1px rgba(255,255,255,0.18), 0 24px 54px rgba(15,23,42,0.46)",
                            "0 0 0 1px rgba(255,255,255,0.14), 0 18px 42px rgba(15,23,42,0.42)",
                          ]
                  }}
                  transition={{
                    duration: active ? 3.2 : 4.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: ambientDelay,
                  }}
                  className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-full border text-center ${
                    active
                      ? "border-sky-300/65 bg-gradient-to-br from-sky-400/34 via-indigo-400/24 to-fuchsia-400/26"
                      : childOption
                        ? "border-fuchsia-300/28 bg-gradient-to-br from-white/[0.14] to-white/[0.08]"
                        : "border-slate-200/16 bg-slate-100/[0.10]"
                  }`}
                >
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-[12%] rounded-full blur-xl"
                    animate={{
                      opacity: active ? [0.3, 0.48, 0.3] : [0.14, 0.22, 0.14],
                      scale: active ? [0.92, 1.04, 0.92] : [0.96, 1.01, 0.96],
                    }}
                    transition={{ duration: active ? 3.4 : 4.8, repeat: Infinity, ease: "easeInOut", delay: ambientDelay }}
                    style={{
                      background: active
                        ? "radial-gradient(circle, rgba(94,164,255,0.42), rgba(133,123,255,0.14), transparent 72%)"
                        : "radial-gradient(circle, rgba(255,255,255,0.12), rgba(133,123,255,0.08), transparent 72%)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <div className="relative flex max-w-[76%] flex-col items-center gap-1.5">
                    <div className="text-[9px] uppercase tracking-[0.22em] text-slate-300/85">{node.type}</div>
                    <div className={`${active ? "text-[13px]" : "text-[11px]"} font-medium leading-[1.15] text-white`}>
                      {shorten(node.title, active ? 28 : 18)}
                    </div>
                    {active && (
                      <div className="flex flex-wrap justify-center gap-1">
                        {node.skills_gained.slice(0, 3).map((skill) => (
                          <span key={skill} className="rounded-full bg-white/12 px-2 py-1 text-[8px] text-slate-100">
                            {shorten(skill, 10)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {hoveredNode && previewPosition && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute z-40 w-[240px] rounded-[22px] border border-white/12 bg-slate-950/88 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl"
            style={previewPosition}
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{hoveredNode.type}</div>
            <div className="mt-1 text-sm font-medium text-white">{hoveredNode.title}</div>
            <p className="mt-2 text-xs leading-5 text-slate-300">{shorten(hoveredNode.short_summary, 110)}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {hoveredNode.skills_gained.slice(0, 4).map((skill) => (
                <span key={skill} className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-slate-100">
                  {shorten(skill, 16)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">{shorten(hoveredNode.why_it_matters, 108)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Edge({
  source,
  target,
  activeNodeId,
}: {
  edge: EdgePayload;
  source?: PositionedNode;
  target?: PositionedNode;
  activeNodeId: string;
}) {
  if (!source || !target) return null;

  const sourceRadius = getRadius(source, activeNodeId);
  const targetRadius = getRadius(target, activeNodeId);
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const unitX = dx / distance;
  const unitY = dy / distance;
  const normalX = -unitY;
  const normalY = unitX;

  const start = { x: source.x + unitX * sourceRadius + WORLD_HALF, y: source.y + unitY * sourceRadius + WORLD_HALF };
  const end = { x: target.x - unitX * targetRadius + WORLD_HALF, y: target.y - unitY * targetRadius + WORLD_HALF };
  const bend = Math.min(42, distance * 0.12);
  const control = { x: (start.x + end.x) / 2 + normalX * bend, y: (start.y + end.y) / 2 + normalY * bend };
  const pathValue = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;

  const tangent = normalize({ x: end.x - control.x, y: end.y - control.y });
  const arrowTip = { x: end.x, y: end.y };
  const arrowBase = { x: arrowTip.x - tangent.x * 13, y: arrowTip.y - tangent.y * 13 };
  const sideX = -tangent.y * 5;
  const sideY = tangent.x * 5;
  const arrowLeft = { x: arrowBase.x + sideX, y: arrowBase.y + sideY };
  const arrowRight = { x: arrowBase.x - sideX, y: arrowBase.y - sideY };
  const arrowPoints = `${arrowTip.x},${arrowTip.y} ${arrowLeft.x},${arrowLeft.y} ${arrowRight.x},${arrowRight.y}`;

  return (
    <>
      <path d={pathValue} fill="none" stroke="rgba(191,219,254,0.58)" strokeWidth="2.4" strokeLinecap="round" />
      <polygon points={arrowPoints} fill="rgba(191,219,254,0.78)" />
    </>
  );
}

function getRadius(node: PositionedNode, activeNodeId: string) {
  if (node.id === activeNodeId) return 108;
  if (node.parent_id === activeNodeId && !node.visited) return 64;
  return 58;
}

function normalize(vector: { x: number; y: number }) {
  const length = Math.max(Math.hypot(vector.x, vector.y), 1);
  return { x: vector.x / length, y: vector.y / length };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shorten(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trim()}...`;
}

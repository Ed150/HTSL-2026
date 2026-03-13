import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { PathRecord, PositionedNode } from "../types";

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

  const visibleNodes = useMemo(
    () =>
      path.nodes.filter((node) => {
        if (node.id === activeNode.id) return true;
        if (node.visited) return true;
        return node.parent_id === activeNode.id;
      }),
    [path.nodes, activeNode.id]
  );
  const hoveredNode = visibleNodes.find((node) => node.id === hoveredId) ?? null;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStart.current) return;
    onPanChange({
      x: dragStart.current.panX + (event.clientX - dragStart.current.x),
      y: dragStart.current.panY + (event.clientY - dragStart.current.y),
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
        top: `calc(50% + ${hoveredNode.y * zoom + pan.y - 34}px)`,
      }
    : null;

  const handleSingleClick = (node: PositionedNode) => {
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      onSelect(node);
      onOpenDetail(node);
      clickTimer.current = null;
    }, 180);
  };

  const handleDoubleClick = (node: PositionedNode) => {
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
        <AnimatePresence>
          {visibleNodes.map((node, index) => {
            const active = node.id === activeNode.id;
            const childOption = node.parent_id === activeNode.id && !node.visited;
            const nodeRadius = active ? 108 : childOption ? 64 : 58;
            const hovered = hoveredId === node.id;
            const bubbleState = getBubbleState({ active, hovered, visited: node.visited, childOption });

            return (
              <motion.button
                key={node.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 230, damping: 24 }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId((current) => (current === node.id ? null : current))}
                onClick={(event) => {
                  event.stopPropagation();
                  handleSingleClick(node);
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  handleDoubleClick(node);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none ${
                  active ? "z-30" : hovered ? "z-20" : "z-10"
                }`}
                style={{ left: node.x + WORLD_HALF, top: node.y + WORLD_HALF, width: nodeRadius * 2, height: nodeRadius * 2 }}
              >
                <motion.div
                  aria-hidden="true"
                  className="absolute -inset-[14%] rounded-full blur-2xl"
                  animate={bubbleState.halo}
                  transition={{
                    duration: bubbleState.haloDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.08,
                  }}
                  style={{ background: bubbleState.haloBackground }}
                />
                <motion.div
                  animate={bubbleState.shell}
                  whileHover={{ scale: 1.03 }}
                  transition={{
                    duration: bubbleState.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.08,
                  }}
                  className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-full border text-center ${bubbleState.className}`}
                >
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-[10%] rounded-full blur-xl"
                    animate={bubbleState.core}
                    transition={{
                      duration: bubbleState.coreDuration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.05,
                    }}
                    style={{ background: bubbleState.coreBackground }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-[5%] rounded-full border"
                    animate={bubbleState.ring}
                    transition={{
                      duration: bubbleState.ringDuration,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ borderColor: bubbleState.ringColor }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent" />
                  <div className="relative flex max-w-[76%] flex-col items-center gap-1.5">
                    <div className="text-[9px] uppercase tracking-[0.22em] text-slate-300/88">{node.type}</div>
                    <div className={`${active ? "text-[13px]" : "text-[11px]"} font-medium leading-[1.12] text-white`}>
                      {shorten(node.title, active ? 30 : 18)}
                    </div>
                    {active && (
                      <div className="flex flex-wrap justify-center gap-1">
                        {(node.tags.length > 0 ? node.tags : node.skills_gained).slice(0, 3).map((skill) => (
                          <span key={skill} className="rounded-full bg-white/12 px-2 py-1 text-[8px] text-slate-100">
                            {shorten(skill, 11)}
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
            className="pointer-events-none absolute z-40 w-[260px] rounded-[22px] border border-white/12 bg-slate-950/90 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl"
            style={previewPosition}
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{hoveredNode.type}</div>
            <div className="mt-1 text-sm font-medium text-white">{hoveredNode.title}</div>
            <div className="mt-1 text-[11px] text-slate-400">
              {hoveredNode.source}
              {hoveredNode.campus ? ` | ${hoveredNode.campus}` : ""}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300">{shorten(hoveredNode.short_summary, 118)}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {hoveredNode.skills_gained.slice(0, 4).map((skill) => (
                <span key={skill} className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-slate-100">
                  {shorten(skill, 16)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">{shorten(hoveredNode.why_it_matters, 110)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getBubbleState({
  active,
  hovered,
  visited,
  childOption,
}: {
  active: boolean;
  hovered: boolean;
  visited: boolean;
  childOption: boolean;
}) {
  if (active) {
    return {
      className: "border-sky-300/65 bg-gradient-to-br from-sky-400/36 via-indigo-400/22 to-fuchsia-400/24",
      duration: 3.4,
      coreDuration: 3.1,
      ringDuration: 4.2,
      haloDuration: 4.7,
      haloBackground: "radial-gradient(circle, rgba(86,165,255,0.46), rgba(123,97,255,0.18), transparent 72%)",
      coreBackground: "radial-gradient(circle, rgba(255,255,255,0.18), rgba(117,165,255,0.16), transparent 74%)",
      ringColor: "rgba(191,219,254,0.28)",
      shell: {
        boxShadow: [
          "0 0 0 1px rgba(125,211,252,0.34), 0 0 44px rgba(94,164,255,0.26)",
          "0 0 0 1px rgba(125,211,252,0.46), 0 0 84px rgba(94,164,255,0.42)",
          "0 0 0 1px rgba(125,211,252,0.34), 0 0 44px rgba(94,164,255,0.26)",
        ],
        opacity: [0.985, 1, 0.985],
      },
      halo: {
        opacity: [0.42, 0.62, 0.42],
        scale: [0.96, 1.08, 0.96],
      },
      core: {
        opacity: [0.18, 0.36, 0.18],
        scale: [0.92, 1.06, 0.92],
      },
      ring: {
        opacity: [0.35, 0.7, 0.35],
        scale: [0.96, 1.03, 0.96],
      },
    };
  }

  if (hovered) {
    return {
      className: childOption
        ? "border-fuchsia-300/42 bg-gradient-to-br from-white/[0.18] to-white/[0.10]"
        : "border-slate-100/24 bg-slate-100/[0.12]",
      duration: 3.8,
      coreDuration: 3.8,
      ringDuration: 4.8,
      haloDuration: 5.2,
      haloBackground: "radial-gradient(circle, rgba(173,139,255,0.32), rgba(110,176,255,0.14), transparent 72%)",
      coreBackground: "radial-gradient(circle, rgba(255,255,255,0.16), rgba(173,139,255,0.12), transparent 72%)",
      ringColor: "rgba(255,255,255,0.18)",
      shell: {
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.16), 0 0 36px rgba(133,123,255,0.22)",
          "0 0 0 1px rgba(255,255,255,0.24), 0 0 56px rgba(133,123,255,0.34)",
          "0 0 0 1px rgba(255,255,255,0.16), 0 0 36px rgba(133,123,255,0.22)",
        ],
        opacity: [0.99, 1, 0.99],
      },
      halo: {
        opacity: [0.22, 0.34, 0.22],
        scale: [0.98, 1.05, 0.98],
      },
      core: {
        opacity: [0.14, 0.24, 0.14],
        scale: [0.96, 1.03, 0.96],
      },
      ring: {
        opacity: [0.24, 0.48, 0.24],
        scale: [0.98, 1.02, 0.98],
      },
    };
  }

  if (visited) {
    return {
      className: "border-slate-100/18 bg-slate-100/[0.10]",
      duration: 5.6,
      coreDuration: 5.4,
      ringDuration: 6.2,
      haloDuration: 6.8,
      haloBackground: "radial-gradient(circle, rgba(103,143,255,0.14), rgba(255,255,255,0.05), transparent 76%)",
      coreBackground: "radial-gradient(circle, rgba(255,255,255,0.10), rgba(164,173,255,0.06), transparent 75%)",
      ringColor: "rgba(255,255,255,0.10)",
      shell: {
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.12), 0 14px 32px rgba(15,23,42,0.38)",
          "0 0 0 1px rgba(255,255,255,0.18), 0 20px 42px rgba(15,23,42,0.42)",
          "0 0 0 1px rgba(255,255,255,0.12), 0 14px 32px rgba(15,23,42,0.38)",
        ],
        opacity: [0.985, 1, 0.985],
      },
      halo: {
        opacity: [0.1, 0.18, 0.1],
        scale: [0.98, 1.02, 0.98],
      },
      core: {
        opacity: [0.08, 0.14, 0.08],
        scale: [0.97, 1.01, 0.97],
      },
      ring: {
        opacity: [0.14, 0.22, 0.14],
        scale: [0.99, 1.01, 0.99],
      },
    };
  }

  return {
    className: "border-fuchsia-300/28 bg-gradient-to-br from-white/[0.14] to-white/[0.08]",
    duration: 5.2,
    coreDuration: 4.9,
    ringDuration: 5.8,
    haloDuration: 6,
    haloBackground: "radial-gradient(circle, rgba(255,255,255,0.14), rgba(133,123,255,0.08), transparent 76%)",
    coreBackground: "radial-gradient(circle, rgba(255,255,255,0.12), rgba(163,139,255,0.08), transparent 76%)",
    ringColor: "rgba(255,255,255,0.09)",
    shell: {
      boxShadow: [
        "0 0 0 1px rgba(255,255,255,0.13), 0 16px 36px rgba(15,23,42,0.4)",
        "0 0 0 1px rgba(255,255,255,0.18), 0 22px 46px rgba(15,23,42,0.44)",
        "0 0 0 1px rgba(255,255,255,0.13), 0 16px 36px rgba(15,23,42,0.4)",
      ],
      opacity: [0.985, 1, 0.985],
    },
    halo: {
      opacity: [0.12, 0.2, 0.12],
      scale: [0.98, 1.03, 0.98],
    },
    core: {
      opacity: [0.1, 0.16, 0.1],
      scale: [0.97, 1.02, 0.97],
    },
    ring: {
      opacity: [0.12, 0.2, 0.12],
      scale: [0.99, 1.01, 0.99],
    },
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shorten(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trim()}...`;
}

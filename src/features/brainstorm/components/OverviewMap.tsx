import type React from "react";
import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { CENTER_BOX, WORLD_CENTER } from "../constants";
import { clamp } from "../math";
import type { CanvasView, Idea, Placed } from "../types";

export type OverviewMapProps = {
  placements: Placed[];
  ideas: Idea[];
  viewportSize: { w: number; h: number };
  view: CanvasView;
  viewportStroke: string;
  clearMode?: boolean;
  onFocusWorldPoint: (point: { x: number; y: number }) => void;
};

export function OverviewMap({
  placements,
  ideas,
  viewportSize,
  view,
  viewportStroke,
  clearMode = false,
  onFocusWorldPoint,
}: OverviewMapProps) {
  const draggingRef = useRef(false);
  const mapW = 190;
  const mapH = 132;
  const bounds = useMemo(() => {
    const boxes = [CENTER_BOX, ...placements];
    const minX = Math.min(...boxes.map((box) => box.x - box.w / 2)) - 260;
    const maxX = Math.max(...boxes.map((box) => box.x + box.w / 2)) + 260;
    const minY = Math.min(...boxes.map((box) => box.y - box.h / 2)) - 220;
    const maxY = Math.max(...boxes.map((box) => box.y + box.h / 2)) + 220;
    const width = Math.max(900, maxX - minX);
    const height = Math.max(620, maxY - minY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return {
      minX: cx - width / 2,
      minY: cy - height / 2,
      width,
      height,
    };
  }, [placements]);

  const scale = Math.min((mapW - 20) / bounds.width, (mapH - 20) / bounds.height);
  const offsetX = (mapW - bounds.width * scale) / 2;
  const offsetY = (mapH - bounds.height * scale) / 2;
  const mapPoint = (point: { x: number; y: number }) => ({
    x: offsetX + (point.x - bounds.minX) * scale,
    y: offsetY + (point.y - bounds.minY) * scale,
  });

  const visible = {
    x: (0 - view.x) / view.zoom - WORLD_CENTER,
    y: (0 - view.y) / view.zoom - WORLD_CENTER,
    w: viewportSize.w / view.zoom,
    h: viewportSize.h / view.zoom,
  };
  const visiblePoint = mapPoint({ x: visible.x, y: visible.y });
  const visibleRect = {
    x: clamp(visiblePoint.x, 4, mapW - 4),
    y: clamp(visiblePoint.y, 4, mapH - 4),
    w: clamp(visible.w * scale, 8, mapW - 8),
    h: clamp(visible.h * scale, 8, mapH - 8),
  };
  const focusFromPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = clamp(event.clientX - rect.left, 0, mapW);
    const localY = clamp(event.clientY - rect.top, 0, mapH);
    onFocusWorldPoint({
      x: (localX - offsetX) / scale + bounds.minX,
      y: (localY - offsetY) / scale + bounds.minY,
    });
  };

  const stopDragging = (event: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <motion.button
      type="button"
      className="absolute bottom-5 left-5 z-40 block cursor-crosshair border-2 border-foreground/25 bg-card/90 p-2 text-left shadow-[4px_4px_0_color-mix(in_oklab,var(--mit)_24%,transparent)] backdrop-blur active:cursor-grabbing"
      animate={
        clearMode
          ? { x: -236, y: 44, opacity: 0, scale: 0.86 }
          : { x: 0, y: 0, opacity: 1, scale: 1 }
      }
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      style={{
        borderRadius: 3,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        width: mapW,
        height: mapH,
        pointerEvents: clearMode ? "none" : undefined,
      }}
      aria-label="Overview map"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        focusFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        focusFromPointer(event);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        stopDragging(event);
      }}
      onPointerCancel={(event) => {
        event.stopPropagation();
        stopDragging(event);
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <svg aria-hidden className="h-full w-full overflow-visible" viewBox={`0 0 ${mapW} ${mapH}`}>
        <rect
          x="0"
          y="0"
          width={mapW}
          height={mapH}
          rx="3"
          ry="3"
          fill="color-mix(in oklab, var(--card) 72%, transparent)"
          opacity={0.7}
        />
        {ideas.map((idea, index) => {
          const to = placements[index];
          if (!to) return null;
          const from =
            idea.parentId != null
              ? placements[ideas.findIndex((candidate) => candidate.id === idea.parentId)]
              : CENTER_BOX;
          if (!from) return null;
          const a = mapPoint(from);
          const b = mapPoint(to);
          return (
            <line
              key={idea.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-[color:var(--mit)] opacity-45"
            />
          );
        })}
        {placements.map((placement, index) => {
          const point = mapPoint(placement);
          return (
            <rect
              key={ideas[index]?.id ?? index}
              x={point.x - 2.4}
              y={point.y - 2.4}
              width="4.8"
              height="4.8"
              rx="1"
              ry="1"
              fill="currentColor"
              className="text-[color:var(--could)]"
            />
          );
        })}
        {(() => {
          const center = mapPoint(CENTER_BOX);
          return (
            <rect
              x={center.x - 4}
              y={center.y - 4}
              width="8"
              height="8"
              rx="1"
              ry="1"
              fill="currentColor"
              className="text-[color:var(--mit)]"
            />
          );
        })()}
        <rect
          x={visibleRect.x}
          y={visibleRect.y}
          width={Math.min(visibleRect.w, mapW - visibleRect.x - 4)}
          height={Math.min(visibleRect.h, mapH - visibleRect.y - 4)}
          rx="3"
          ry="3"
          fill="none"
          stroke={viewportStroke}
          strokeWidth="2"
        />
      </svg>
    </motion.button>
  );
}

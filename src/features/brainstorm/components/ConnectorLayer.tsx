import { motion } from "framer-motion";
import { connectorPathFromPoints, toScreenPoint } from "../canvas";
import { depthLevel } from "../graph";
import { safeSvgId, sketchMarkerForDepth } from "../theme";
import { cn } from "@/lib/utils";
import type { CanvasView, Idea, Placed, ShapeKey, ShapeTheme, SketchPalette } from "../types";

type ConnectorLayerProps = {
  ideas: Idea[];
  placements: Placed[];
  depthById: Map<string, number>;
  viewportSize: { w: number; h: number };
  view: CanvasView;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  focusedId: string | null;
  focusedPathIds: Set<string>;
  focusedBranchIds: Set<string>;
  lastAddedId: string | null;
};

export function ConnectorLayer({
  ideas,
  placements,
  depthById,
  viewportSize,
  view,
  shape,
  theme,
  sketchPalette,
  focusedId,
  focusedPathIds,
  focusedBranchIds,
  lastAddedId,
}: ConnectorLayerProps) {
  const placementById = new Map<string, Placed>();
  ideas.forEach((idea, index) => {
    const placement = placements[index];
    if (placement) placementById.set(idea.id, placement);
  });

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      width={viewportSize.w}
      height={viewportSize.h}
    >
      {ideas.map((idea, index) => {
        const to = placements[index];
        if (!to) return null;
        const from = idea.parentId ? placementById.get(idea.parentId) : undefined;
        if (!from) return null;
        const isNew = idea.id === lastAddedId;
        const isSelectedOutgoing = focusedId != null && idea.parentId === focusedId;
        const isFocusPath = focusedPathIds.has(idea.id);
        const isRelatedFocus = focusedId != null && focusedBranchIds.has(idea.id);
        const isDimmed = focusedId != null && !isRelatedFocus;
        const start = toScreenPoint(from, view);
        const end = toScreenPoint(to, view);
        const path = connectorPathFromPoints(start, end, theme.lineMode, index);
        const lineLevel = depthLevel(depthById.get(idea.id) ?? 0);
        const lineScale = Math.max(0.58, 1 - lineLevel * 0.11);
        const sketchMarker = sketchMarkerForDepth(sketchPalette, depthById.get(idea.id) ?? 0);
        const markerId = `sketch-arrowhead-${safeSvgId(idea.id)}`;

        return (
          <g key={idea.id}>
            {shape === "blob" && (
              <defs>
                <marker
                  id={markerId}
                  markerWidth="14"
                  markerHeight="14"
                  refX="12"
                  refY="7"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path
                    d="M 1 1 L 12 7 L 1 13"
                    fill="none"
                    stroke={sketchMarker.line}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </marker>
              </defs>
            )}
            {(isSelectedOutgoing || isFocusPath) && shape !== "blob" && (
              <motion.path
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth={(isFocusPath ? 10 : 8) * lineScale}
                strokeLinecap={shape === "boxy" ? "square" : "round"}
                strokeLinejoin={shape === "boxy" ? "miter" : "round"}
                className="text-[color:var(--mit)] opacity-25"
                initial={isNew ? { pathLength: 0, opacity: 0 } : false}
                animate={{ pathLength: 1, opacity: 0.25 }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                style={{
                  filter: "drop-shadow(0 0 10px color-mix(in oklab, var(--mit) 70%, transparent))",
                }}
              />
            )}
            <motion.path
              d={path}
              fill="none"
              stroke={shape === "blob" ? sketchMarker.line : "currentColor"}
              strokeWidth={
                (isSelectedOutgoing
                  ? shape === "blob"
                    ? 3
                    : 3.4
                  : isFocusPath
                    ? shape === "blob"
                      ? 3.4
                      : 3.8
                    : shape === "boxy"
                      ? 1.5
                      : shape === "blob"
                        ? 2.2
                        : 2) * lineScale
              }
              strokeLinecap={shape === "boxy" ? "square" : "round"}
              strokeLinejoin={shape === "boxy" ? "miter" : "round"}
              markerEnd={shape === "blob" ? `url(#${markerId})` : undefined}
              className={cn(
                shape !== "blob" && "text-[color:var(--mit)]",
                isDimmed
                  ? "opacity-15"
                  : isSelectedOutgoing || isFocusPath
                    ? "opacity-95"
                    : shape === "blob"
                      ? "opacity-75"
                      : "opacity-55",
              )}
              initial={isNew ? { pathLength: 0, opacity: 0 } : false}
              animate={{
                pathLength: 1,
                opacity: isDimmed
                  ? 0.15
                  : isSelectedOutgoing || isFocusPath
                    ? 0.95
                    : shape === "blob"
                      ? 0.75
                      : 0.55,
              }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            />
          </g>
        );
      })}
    </svg>
  );
}

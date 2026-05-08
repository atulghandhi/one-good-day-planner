import type React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toCanvasPoint } from "../canvas";
import { depthLevel, ideaFontSize } from "../graph";
import { shapeStyle } from "../theme";
import type { Idea, Placed, ShapeKey, ShapeTheme, SketchMarker, SketchPalette } from "../types";

export type IdeaNodeProps = {
  idea: Idea;
  placement: Placed;
  depth: number;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  sketchMarker: SketchMarker;
  isNew: boolean;
  isFocused: boolean;
  isEditing: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommitEdit: (text: string) => void;
  onStartDrag: (event: React.PointerEvent<HTMLElement>) => void;
};

export function IdeaNode({
  idea,
  placement,
  depth,
  shape,
  theme,
  sketchPalette,
  sketchMarker,
  isNew,
  isFocused,
  isEditing,
  isDragging,
  onRemove,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onStartDrag,
}: IdeaNodeProps) {
  const [draftText, setDraftText] = useState(idea.text);

  useEffect(() => setDraftText(idea.text), [idea.text]);

  const commit = () => {
    const text = draftText.trim();
    if (text) onCommitEdit(text);
    else setDraftText(idea.text);
  };

  const canvasPoint = toCanvasPoint(placement);
  const isSketch = shape === "blob";
  const level = depthLevel(depth);
  const fontSize = isSketch ? Math.max(12.5, 15.5 - level * 1.15) : ideaFontSize(level);
  const fontWeight = isSketch ? Math.max(600, 800 - level * 55) : Math.max(520, 650 - level * 45);
  const focusScale = Math.max(1.025, 1.08 - level * 0.012);
  const focusRing = Math.max(1, 2 - level * 0.22);
  const focusedShadow = isSketch
    ? `0 0 0 ${Math.max(2, focusRing)}px ${sketchPalette.ink}, 0 0 0 ${Math.max(
        8,
        12 - level,
      )}px ${sketchMarker.markerGlow}, 5px 7px 0 ${sketchPalette.shadow}`
    : `0 0 0 ${focusRing}px color-mix(in oklab, var(--mit) ${Math.max(
        38,
        62 - level * 6,
      )}%, transparent), 0 ${Math.max(8, 14 - level)}px ${Math.max(
        22,
        42 - level * 5,
      )}px -12px color-mix(in oklab, var(--mit) ${Math.max(20, 44 - level * 6)}%, transparent)`;
  const restingShadow = isSketch
    ? `3px 4px 0 ${sketchPalette.shadow}`
    : level === 0
      ? undefined
      : `0 ${Math.max(5, 8 - level)}px ${Math.max(
          12,
          20 - level * 2,
        )}px -16px color-mix(in oklab, var(--foreground) 22%, transparent)`;
  const nestedBorder = isSketch
    ? "0 solid transparent"
    : level > 0
      ? `1px solid color-mix(in oklab, var(--foreground) ${Math.max(
          14,
          22 - level * 2,
        )}%, transparent)`
      : undefined;
  const ringWidth = Math.max(3, 7 - level * 0.8);

  return (
    <div
      className="group pointer-events-auto absolute z-20"
      style={{
        left: canvasPoint.x,
        top: canvasPoint.y,
        transform: "translate(-50%, -50%)",
        width: placement.w,
      }}
    >
      <motion.div
        initial={isNew ? { scale: 0.74, opacity: 0 } : { scale: 0.92, opacity: 0 }}
        animate={{
          scale: isFocused ? focusScale : 1,
          opacity: 1,
        }}
        exit={{ scale: 0.82, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative"
      >
        <div
          onPointerDown={(event) => {
            if (event.detail > 1) {
              event.stopPropagation();
              onStartEdit();
              return;
            }
            onStartDrag(event);
          }}
          onClick={(event) => {
            if (isEditing) return;
            event.stopPropagation();
            onSelect();
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onStartEdit();
          }}
          className={cn(
            "relative flex min-h-11 select-none items-center justify-center overflow-visible px-3 py-2 text-center text-sm font-medium text-foreground transition-shadow",
            isDragging ? "cursor-grabbing" : "cursor-grab",
            theme.cardClassName,
          )}
          style={{
            ...shapeStyle(shape),
            width: placement.w,
            minHeight: placement.h,
            fontFamily: theme.fontFamily,
            fontSize,
            fontWeight,
            lineHeight: 1.2,
            border: nestedBorder,
            boxShadow: isFocused ? focusedShadow : restingShadow,
            backgroundColor: isSketch ? sketchPalette.card : undefined,
            color: isSketch ? sketchPalette.ink : undefined,
            opacity: idea.done ? 0.72 : 1,
          }}
        >
          {isSketch && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  ...shapeStyle(shape),
                  inset: -10 + level,
                  border: `${ringWidth}px solid ${sketchMarker.marker}`,
                  opacity: isFocused ? 0.9 : 0.72,
                  transform: `rotate(${(idea.id.charCodeAt(0) % 7) - 3}deg) scaleX(1.03)`,
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  ...shapeStyle(shape),
                  inset: -5 + level,
                  border: `${Math.max(2, ringWidth * 0.48)}px solid ${sketchMarker.markerDark}`,
                  opacity: isFocused ? 0.5 : 0.32,
                  transform: `rotate(${(idea.id.charCodeAt(idea.id.length - 1) % 9) - 4}deg) scaleY(1.04)`,
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  ...shapeStyle(shape),
                  inset: -2 + level,
                  border: `2px solid ${sketchPalette.ringHighlight}`,
                  opacity: 0.62,
                  transform: "rotate(-2deg) scaleX(0.98)",
                }}
              />
            </>
          )}
          {(idea.kind || idea.done) && !isEditing && (
            <span
              className={cn(
                "absolute -left-2 -top-2 z-20 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[9px] font-black uppercase tracking-wide shadow-soft",
                idea.done
                  ? "bg-[color:var(--mit)] text-[color:var(--mit-foreground)]"
                  : "bg-card/95 text-muted-foreground",
              )}
              style={{
                border: isSketch ? `2px solid ${sketchMarker.markerDark}` : undefined,
              }}
            >
              {idea.done ? "✓" : idea.kind}
            </span>
          )}
          {isEditing ? (
            <input
              autoFocus
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commit();
                } else if (event.key === "Escape") {
                  setDraftText(idea.text);
                  onCommitEdit(idea.text);
                }
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              className="w-full bg-transparent text-center outline-none"
              style={{ fontFamily: theme.fontFamily, minWidth: 60 }}
            />
          ) : (
            <span
              className={cn(
                "relative z-10 max-w-full break-words",
                isSketch && "uppercase",
                idea.done && "line-through",
              )}
              style={{
                textShadow: isSketch ? `0.7px 0.55px 0 ${sketchPalette.textShadow}` : undefined,
              }}
            >
              {idea.text}
            </span>
          )}
        </div>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className={cn(
            "absolute -right-2 -top-2 z-10 grid h-5 w-5 place-items-center bg-background/95 text-muted-foreground opacity-0 shadow-soft transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground",
            shape === "boxy" ? "rounded-[3px]" : "rounded-full",
          )}
          aria-label="Remove idea"
        >
          <X className="h-3 w-3" />
        </button>
      </motion.div>
    </div>
  );
}

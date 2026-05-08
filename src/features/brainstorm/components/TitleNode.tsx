import type React from "react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  MAX_TITLE_CHARS,
  SHAPES,
  TITLE_MAX_HEIGHT,
  TITLE_MIN_HEIGHT,
  CENTER_BOX,
} from "../constants";
import { toCanvasPoint } from "../canvas";
import { clamp } from "../math";
import { controlStyle, shapeStyle, SHAPE_THEMES } from "../theme";
import { normalizeTitleValue } from "../storage";
import type { ShapeKey, ShapeTheme, SketchPalette } from "../types";

type TitleNodeProps = {
  title: string;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  centerActive: boolean;
  onActivate: () => void;
  onTitleChange: (title: string) => void;
  onShapeChange: (shape: ShapeKey) => void;
};

export function TitleNode({
  title,
  shape,
  theme,
  sketchPalette,
  centerActive,
  onActivate,
  onTitleChange,
  onShapeChange,
}: TitleNodeProps) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const titlePoint = toCanvasPoint(CENTER_BOX);

  const syncTitleHeight = useCallback((element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${clamp(element.scrollHeight, TITLE_MIN_HEIGHT, TITLE_MAX_HEIGHT)}px`;
  }, []);

  const fitTitleToTwoLines = useCallback(
    (rawValue: string, element: HTMLTextAreaElement) => {
      let next = normalizeTitleValue(rawValue);

      while (next.length > 0) {
        element.value = next;
        syncTitleHeight(element);
        if (element.scrollHeight <= TITLE_MAX_HEIGHT + 1) break;
        next = next.slice(0, -1);
      }

      return next;
    },
    [syncTitleHeight],
  );

  useLayoutEffect(() => {
    if (titleRef.current) syncTitleHeight(titleRef.current);
  }, [title, syncTitleHeight]);

  const activate = (event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    onActivate();
  };

  return (
    <div
      className="pointer-events-auto absolute z-10"
      style={{
        left: titlePoint.x,
        top: titlePoint.y,
        transform: "translate(-50%, -50%)",
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={cn(
          "relative",
          shape === "blob" ? "bg-transparent p-[10px]" : "bg-gradient-mit p-[2px]",
        )}
        style={{
          ...shapeStyle(shape),
          filter:
            shape === "blob"
              ? "none"
              : "drop-shadow(10px 12px 18px color-mix(in oklab, var(--mit) 24%, transparent)) drop-shadow(2px 4px 8px color-mix(in oklab, var(--foreground) 10%, transparent))",
        }}
      >
        {shape === "blob" && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                ...shapeStyle(shape),
                border: `8px solid ${sketchPalette.marker}`,
                opacity: 0.78,
                transform: "rotate(-1.7deg) scaleX(1.03)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-1"
              style={{
                ...shapeStyle(shape),
                border: `4px solid ${sketchPalette.markerDark}`,
                opacity: 0.34,
                transform: "rotate(1.4deg) scaleY(1.04)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-3"
              style={{
                ...shapeStyle(shape),
                border: `2px solid ${sketchPalette.ringHighlight}`,
                opacity: 0.68,
                transform: "rotate(-2deg) scaleX(0.98)",
              }}
            />
          </>
        )}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(event) => {
            onTitleChange(fitTitleToTwoLines(event.currentTarget.value, event.currentTarget));
          }}
          onFocus={(event) => {
            event.currentTarget.select();
            activate(event);
          }}
          onClick={activate}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.currentTarget.value.includes("\n")) {
              event.preventDefault();
            }
          }}
          maxLength={MAX_TITLE_CHARS}
          rows={1}
          className={cn(
            "block min-h-[4.5rem] max-h-[6.625rem] resize-none overflow-hidden text-center outline-none",
            shape === "blob"
              ? "relative z-10 w-[22rem] px-5 py-4 text-4xl font-black uppercase leading-[0.96] focus:ring-0"
              : "w-[22rem] bg-card/95 px-8 py-5 text-2xl font-semibold leading-[1.15] text-foreground focus:ring-2 focus:ring-[color:var(--mit)]",
          )}
          style={{
            ...shapeStyle(shape),
            backgroundColor: shape === "blob" ? sketchPalette.card : undefined,
            color: shape === "blob" ? sketchPalette.ink : undefined,
            fontFamily:
              shape === "blob"
                ? '"Marker Felt", "Arial Black", "Chalkboard SE", "Comic Sans MS", ui-sans-serif, system-ui, sans-serif'
                : theme.fontFamily,
            textShadow: shape === "blob" ? `1.3px 1.1px 0 ${sketchPalette.textShadow}` : undefined,
          }}
          aria-label="Brainstorm title"
        />
      </div>

      <AnimatePresence>
        {centerActive && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className={cn(
              "absolute left-1/2 top-full mt-4 flex -translate-x-1/2 gap-1.5 p-2 shadow-pop backdrop-blur",
              theme.controlClassName,
            )}
            style={controlStyle(shape, theme, sketchPalette)}
            onClick={(event) => event.stopPropagation()}
          >
            {SHAPES.map((candidate) => (
              <button
                key={candidate.key}
                type="button"
                onClick={() => onShapeChange(candidate.key)}
                className={cn(
                  "grid h-10 w-10 place-items-center transition",
                  shape === candidate.key
                    ? "bg-gradient-mit text-primary-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                )}
                style={{
                  ...shapeStyle(candidate.key),
                  fontFamily: SHAPE_THEMES[candidate.key].fontFamily,
                }}
                aria-label={candidate.label}
                title={candidate.label}
              >
                <span
                  className="block h-4 w-4 bg-current opacity-80"
                  style={shapeStyle(candidate.key)}
                />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

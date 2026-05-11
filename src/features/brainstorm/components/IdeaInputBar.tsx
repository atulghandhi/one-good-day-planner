import type React from "react";
import { cn } from "@/lib/utils";
import { shapeStyle } from "../theme";
import type { ShapeKey, ShapeTheme, SketchPalette } from "../types";

type IdeaInputBarProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  draft: string;
  focusedId: string | null;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  onDraftChange: (draft: string) => void;
  onSubmit: () => void;
};

export function IdeaInputBar({
  inputRef,
  draft,
  focusedId,
  shape,
  theme,
  sketchPalette,
  onDraftChange,
  onSubmit,
}: IdeaInputBarProps) {
  return (
    <div
      className={cn(
        "relative",
        shape === "blob" ? "bg-transparent p-[7px]" : "bg-gradient-mit p-[2px] shadow-soft",
      )}
      style={shapeStyle(shape)}
    >
      {shape === "blob" && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              ...shapeStyle(shape),
              border: `6px solid ${sketchPalette.marker}`,
              opacity: 0.72,
              transform: "rotate(-1.5deg)",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-1"
            style={{
              ...shapeStyle(shape),
              border: `3px solid ${sketchPalette.markerDark}`,
              opacity: 0.32,
              transform: "rotate(1.2deg)",
            }}
          />
        </>
      )}
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder={
          focusedId ? "Add a linked idea, press Enter..." : "Add an idea, press Enter..."
        }
        className={cn(
          "relative z-10 w-full px-5 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-[color:var(--mit)]",
          shape === "blob"
            ? "placeholder:text-[color:var(--sketch-placeholder)]"
            : "bg-card/95 text-foreground placeholder:text-muted-foreground",
        )}
        style={{
          ...shapeStyle(shape),
          backgroundColor: shape === "blob" ? sketchPalette.card : undefined,
          color: shape === "blob" ? sketchPalette.ink : undefined,
          ["--sketch-placeholder" as string]: sketchPalette.placeholder,
          fontFamily: theme.fontFamily,
          textAlign: shape === "blob" ? "center" : "left",
        }}
        autoFocus
      />
    </div>
  );
}

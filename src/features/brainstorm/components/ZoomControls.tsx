import { LocateFixed, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlStyle } from "../theme";
import type { ShapeKey, ShapeTheme, SketchPalette } from "../types";

type ZoomControlsProps = {
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
};

export function ZoomControls({
  shape,
  theme,
  sketchPalette,
  onZoomIn,
  onZoomOut,
  onFit,
}: ZoomControlsProps) {
  const buttonClass = cn(
    "grid h-10 w-10 place-items-center text-foreground transition hover:bg-card/90",
    theme.controlClassName,
  );
  const style = controlStyle(shape, theme, sketchPalette);

  return (
    <div
      className="absolute bottom-5 right-5 z-40 flex flex-col gap-2"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={buttonClass}
        style={style}
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={buttonClass}
        style={style}
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={buttonClass}
        style={style}
        onClick={onFit}
        aria-label="Fit brainstorm"
      >
        <LocateFixed className="h-4 w-4" />
      </button>
    </div>
  );
}

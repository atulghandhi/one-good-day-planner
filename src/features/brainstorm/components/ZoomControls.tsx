import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronsLeft,
  ChevronsRight,
  LocateFixed,
  Map as MapIcon,
  Minus,
  Plus,
} from "lucide-react";
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
  onToggleClearMode: () => void;
  clearMode?: boolean;
  onToggleOverviewMap?: () => void;
  overviewMapOpen?: boolean;
};

export function ZoomControls({
  shape,
  theme,
  sketchPalette,
  onZoomIn,
  onZoomOut,
  onFit,
  onToggleClearMode,
  clearMode = false,
  onToggleOverviewMap,
  overviewMapOpen = false,
}: ZoomControlsProps) {
  const buttonClass = cn(
    "grid h-9 w-9 sm:h-10 sm:w-10 place-items-center text-foreground transition hover:bg-card/90",
    theme.controlClassName,
  );
  const style = controlStyle(shape, theme, sketchPalette);

  return (
    <div
      className="absolute bottom-40 sm:bottom-5 right-3 sm:right-5 z-40 flex flex-col items-end gap-1.5 sm:gap-2"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={buttonClass}
        style={style}
        onClick={onToggleClearMode}
        aria-label={clearMode ? "Restore page controls" : "Clear page chrome"}
        title={clearMode ? "Restore controls (Cmd+\\)" : "Clear page (Cmd+\\)"}
      >
        {clearMode ? (
          <ChevronsLeft className="h-4 w-4" strokeWidth={2.6} />
        ) : (
          <ChevronsRight className="h-4 w-4" strokeWidth={2.5} />
        )}
      </button>
      <AnimatePresence>
        {!clearMode && (
          <motion.div
            className="flex flex-col gap-1.5 sm:gap-2"
            initial={false}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 88, opacity: 0, scale: 0.86 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
          >
            {onToggleOverviewMap && (
              <button
                type="button"
                className={cn(
                  buttonClass,
                  "md:hidden",
                  overviewMapOpen && "bg-[color:var(--mit)]/30 text-foreground",
                )}
                style={style}
                onClick={onToggleOverviewMap}
                aria-label={overviewMapOpen ? "Hide overview map" : "Show overview map"}
                title="Overview map"
              >
                <MapIcon className="h-4 w-4" />
              </button>
            )}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

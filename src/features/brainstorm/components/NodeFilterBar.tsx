import { motion } from "framer-motion";
import { FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import { IDEA_KIND_OPTIONS, ideaKindLabel } from "../kinds";
import { controlStyle, sketchChipStyle } from "../theme";
import type { IdeaKind, ShapeKey, ShapeTheme, SketchPalette } from "../types";

type NodeFilterBarProps = {
  activeFilter: IdeaKind | null;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  onFilterChange: (filter: IdeaKind | null) => void;
};

export function NodeFilterBar({
  activeFilter,
  shape,
  theme,
  sketchPalette,
  onFilterChange,
}: NodeFilterBarProps) {
  const isSketch = shape === "blob";
  const chipStyle = sketchChipStyle(shape, theme, sketchPalette);
  const activeChipStyle = sketchChipStyle(shape, theme, sketchPalette, true);

  return (
    <div className="absolute left-1/2 top-16 sm:top-4 z-40 -translate-x-1/2 max-w-[calc(100vw-1.5rem)]">
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -48, scale: 0.86 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 px-1"
        onClick={(event) => event.stopPropagation()}
      >
        {IDEA_KIND_OPTIONS.map((kind) => {
          const active = activeFilter === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onFilterChange(active ? null : kind)}
              className={cn(
                "h-8 sm:h-10 px-3 sm:px-4 text-[11px] sm:text-xs font-black shrink-0 transition hover:-translate-y-0.5",
                isSketch
                  ? "border-2"
                  : cn(
                      "rounded-full",
                      active
                        ? "bg-[color:var(--mit)]/32 text-foreground shadow-soft"
                        : "bg-card/65 text-muted-foreground hover:bg-card hover:text-foreground",
                    ),
              )}
              style={isSketch ? (active ? activeChipStyle : chipStyle) : undefined}
              aria-pressed={active}
            >
              {ideaKindLabel(kind)}
            </button>
          );
        })}
        {activeFilter && (
          <button
            type="button"
            onClick={() => onFilterChange(null)}
            className={cn(
              "grid h-8 w-8 sm:h-10 sm:w-10 place-items-center shrink-0 text-muted-foreground transition hover:text-foreground",
              isSketch ? "border-2" : "rounded-full bg-card/65 hover:bg-card",
            )}
            style={isSketch ? chipStyle : undefined}
            aria-label="Clear node filter"
            title="Clear filter"
          >
            <FilterX className="h-3.5 w-3.5" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

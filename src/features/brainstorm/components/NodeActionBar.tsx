import { motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHAPES } from "../constants";
import { IDEA_KIND_OPTIONS, effectiveIdeaKind, ideaKindLabel } from "../kinds";
import { controlStyle, shapeStyle, sketchChipStyle, SHAPE_THEMES } from "../theme";
import type { Idea, ShapeKey, ShapeTheme, SketchPalette } from "../types";

type NodeActionBarProps = {
  focusedIdea: Idea;
  isRoot: boolean;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  onSendToPlanner: (target: "mit" | "should" | "could") => void;
  onUpdateIdea: (update: (idea: Idea) => Idea) => void;
  onShapeChange: (shape: ShapeKey) => void;
};

export function NodeActionBar({
  focusedIdea,
  isRoot,
  shape,
  theme,
  sketchPalette,
  onSendToPlanner,
  onUpdateIdea,
  onShapeChange,
}: NodeActionBarProps) {
  const isSketch = shape === "blob";
  const chipStyle = sketchChipStyle(shape, theme, sketchPalette);
  const activeChipStyle = sketchChipStyle(shape, theme, sketchPalette, true);
  const actionButtonClass = cn(
    "h-8 sm:h-9 border-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold shrink-0 transition",
    isSketch ? "" : "rounded-full border-0 bg-card/80 text-[11px] hover:bg-card",
  );
  const activeButtonClass = cn(
    "h-8 sm:h-9 border-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold capitalize shrink-0 transition",
    isSketch ? "" : "rounded-full border-0 text-[11px]",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={cn(
        "mx-auto mb-2 flex max-w-full items-center overflow-x-auto no-scrollbar sm:w-fit sm:flex-wrap sm:justify-center py-0.5 px-1",
        isSketch
          ? "gap-1.5 sm:gap-2 p-0"
          : cn("gap-1 sm:gap-1.5 p-1 sm:p-1.5 shadow-pop backdrop-blur", theme.controlClassName),
      )}
      style={
        isSketch ? { fontFamily: theme.fontFamily } : controlStyle(shape, theme, sketchPalette)
      }
    >
      <button
        type="button"
        onClick={() => onSendToPlanner("mit")}
        className={cn("inline-flex items-center gap-1", actionButtonClass)}
        style={isSketch ? chipStyle : undefined}
      >
        <Send className="h-3 w-3" />
        MIT
      </button>
      <button
        type="button"
        onClick={() => onSendToPlanner("should")}
        className={actionButtonClass}
        style={isSketch ? chipStyle : undefined}
      >
        Should
      </button>
      <button
        type="button"
        onClick={() => onSendToPlanner("could")}
        className={actionButtonClass}
        style={isSketch ? chipStyle : undefined}
      >
        Could
      </button>
      <span className="mx-0.5 h-6 sm:h-7 w-px shrink-0 bg-current/20" aria-hidden />
      {IDEA_KIND_OPTIONS.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() =>
            onUpdateIdea((idea) => ({
              ...idea,
              kind: kind === "idea" ? undefined : kind,
            }))
          }
          className={cn(
            activeButtonClass,
            !isSketch &&
              (effectiveIdeaKind(focusedIdea) === kind
                ? "bg-[color:var(--mit)]/30 text-foreground"
                : "bg-card/60 text-muted-foreground hover:bg-card"),
          )}
          style={
            isSketch
              ? effectiveIdeaKind(focusedIdea) === kind
                ? activeChipStyle
                : chipStyle
              : undefined
          }
        >
          {ideaKindLabel(kind)}
        </button>
      ))}
      {(focusedIdea.kind === "task" || focusedIdea.done) && (
        <button
          type="button"
          onClick={() =>
            onUpdateIdea((idea) => ({
              ...idea,
              kind: "task",
              done: !idea.done,
            }))
          }
          className={cn(
            "grid h-8 w-8 sm:h-9 sm:w-9 place-items-center border-2 shrink-0 transition",
            isSketch
              ? ""
              : cn(
                  "rounded-full border-0",
                  focusedIdea.done
                    ? "bg-[color:var(--mit)] text-[color:var(--mit-foreground)]"
                    : "bg-card/80 text-muted-foreground hover:bg-card",
                ),
          )}
          style={isSketch ? (focusedIdea.done ? activeChipStyle : chipStyle) : undefined}
          aria-label={focusedIdea.done ? "Mark node open" : "Mark node done"}
          title={focusedIdea.done ? "Done" : "Mark done"}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      )}
      {isRoot && (
        <>
          <span className="mx-0.5 h-6 sm:h-7 w-px shrink-0 bg-current/20" aria-hidden />
          {SHAPES.map((candidate) => (
            <button
              key={candidate.key}
              type="button"
              onClick={() => onShapeChange(candidate.key)}
              className={cn(
                "grid h-8 w-8 sm:h-9 sm:w-9 place-items-center border-2 shrink-0 transition",
                !isSketch &&
                  (shape === candidate.key
                    ? "rounded-full bg-[color:var(--mit)]/30 text-foreground"
                    : "rounded-full bg-card/70 text-muted-foreground hover:bg-card"),
              )}
              style={
                isSketch
                  ? shape === candidate.key
                    ? activeChipStyle
                    : chipStyle
                  : {
                      ...shapeStyle(candidate.key),
                      fontFamily: SHAPE_THEMES[candidate.key].fontFamily,
                    }
              }
              aria-label={`Use ${candidate.label} board style`}
              title={candidate.label}
            >
              <span
                className="block h-3.5 w-3.5 bg-current opacity-80"
                style={shapeStyle(candidate.key)}
              />
            </button>
          ))}
        </>
      )}
    </motion.div>
  );
}

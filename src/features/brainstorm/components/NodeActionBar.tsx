import { motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlStyle, sketchChipStyle } from "../theme";
import type { Idea, ShapeKey, ShapeTheme, SketchPalette } from "../types";

type NodeActionBarProps = {
  focusedIdea: Idea;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  onSendToPlanner: (target: "mit" | "should" | "could") => void;
  onUpdateIdea: (update: (idea: Idea) => Idea) => void;
};

export function NodeActionBar({
  focusedIdea,
  shape,
  theme,
  sketchPalette,
  onSendToPlanner,
  onUpdateIdea,
}: NodeActionBarProps) {
  const isSketch = shape === "blob";
  const chipStyle = sketchChipStyle(shape, theme, sketchPalette);
  const activeChipStyle = sketchChipStyle(shape, theme, sketchPalette, true);
  const actionButtonClass = cn(
    "h-9 border-2 px-3 text-xs font-bold transition",
    isSketch ? "" : "rounded-full border-0 bg-card/80 text-[11px] hover:bg-card",
  );
  const activeButtonClass = cn(
    "h-9 border-2 px-3 text-xs font-bold capitalize transition",
    isSketch ? "" : "rounded-full border-0 text-[11px]",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={cn(
        "mx-auto mb-2 flex w-fit flex-wrap items-center justify-center",
        isSketch
          ? "gap-2 p-0"
          : cn("gap-1.5 p-1.5 shadow-pop backdrop-blur", theme.controlClassName),
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
      <span className="mx-0.5 h-7 w-px bg-current/20" aria-hidden />
      {(["idea", "task", "note", "decision"] as const).map((kind) => (
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
              ((focusedIdea.kind ?? "idea") === kind
                ? "bg-[color:var(--mit)]/30 text-foreground"
                : "bg-card/60 text-muted-foreground hover:bg-card"),
          )}
          style={
            isSketch
              ? (focusedIdea.kind ?? "idea") === kind
                ? activeChipStyle
                : chipStyle
              : undefined
          }
        >
          {kind}
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
            "grid h-9 w-9 place-items-center border-2 transition",
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
    </motion.div>
  );
}

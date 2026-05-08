import { motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlStyle } from "../theme";
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={cn(
        "mx-auto mb-2 flex w-fit flex-wrap items-center justify-center gap-1.5 p-1.5 shadow-pop backdrop-blur",
        theme.controlClassName,
      )}
      style={controlStyle(shape, theme, sketchPalette)}
    >
      <button
        type="button"
        onClick={() => onSendToPlanner("mit")}
        className="inline-flex h-8 items-center gap-1 rounded-full bg-card/80 px-2.5 text-[11px] font-bold hover:bg-card"
      >
        <Send className="h-3 w-3" />
        MIT
      </button>
      <button
        type="button"
        onClick={() => onSendToPlanner("should")}
        className="h-8 rounded-full bg-card/80 px-2.5 text-[11px] font-bold hover:bg-card"
      >
        Should
      </button>
      <button
        type="button"
        onClick={() => onSendToPlanner("could")}
        className="h-8 rounded-full bg-card/80 px-2.5 text-[11px] font-bold hover:bg-card"
      >
        Could
      </button>
      <span className="mx-0.5 h-5 w-px bg-border/60" aria-hidden />
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
            "h-8 rounded-full px-2.5 text-[11px] font-bold capitalize transition",
            (focusedIdea.kind ?? "idea") === kind
              ? "bg-[color:var(--mit)]/30 text-foreground"
              : "bg-card/60 text-muted-foreground hover:bg-card",
          )}
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
            "grid h-8 w-8 place-items-center rounded-full transition",
            focusedIdea.done
              ? "bg-[color:var(--mit)] text-[color:var(--mit-foreground)]"
              : "bg-card/80 text-muted-foreground hover:bg-card",
          )}
          aria-label={focusedIdea.done ? "Mark node open" : "Mark node done"}
          title={focusedIdea.done ? "Done" : "Mark done"}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      )}
    </motion.div>
  );
}

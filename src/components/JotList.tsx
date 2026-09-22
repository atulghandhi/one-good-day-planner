import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import type { TaskItem } from "@/features/planner/types";
import { PillTextArea } from "./PillInput";

type Props = {
  items: TaskItem[];
  onChange: (items: TaskItem[]) => void;
  onLimitReached: (message: string) => void;
};

export function JotList({ items, onChange, onLimitReached }: Props) {
  const update = (index: number, patch: Partial<TaskItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const add = () => onChange([...items, { text: "", done: false }]);
  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length ? next : [{ text: "", done: false }]);
  };

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-[2rem] border border-white/40 bg-card/70 p-6 shadow-soft backdrop-blur-sm md:p-7"
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-mit text-xl shadow-pop"
            aria-hidden
          >
            ✎
          </span>
          <div>
            <h2 className="t-display-sm leading-none">Jot down</h2>
            <p className="mt-1 t-meta text-muted-foreground">One open list. No categories.</p>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={add}
          whileTap={{ scale: 0.85, rotate: -10 }}
          whileHover={{ scale: 1.08, rotate: 8 }}
          className="grid h-11 w-11 place-items-center rounded-full bg-gradient-mit text-foreground shadow-pop"
          aria-label="Add an idea"
        >
          <Plus className="h-5 w-5" strokeWidth={2.8} />
        </motion.button>
      </header>
      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <motion.li
              key={index}
              layout="position"
              initial={{ opacity: 0, height: 0, scale: 0.92 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.92 }}
              className="group relative overflow-hidden rounded-[1.45rem]"
            >
              <PillTextArea
                tone="neutral"
                value={item.text}
                done={item.done}
                readOnly={item.done}
                autoFocus={!item.done && index === items.length - 1 && index > 0 && !item.text}
                onChange={(event) => update(index, { text: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && item.text.trim()) {
                    event.preventDefault();
                    add();
                  }
                  if (event.key === "Backspace" && !item.text && items.length > 1) {
                    event.preventDefault();
                    remove(index);
                  }
                }}
                placeholder="Jot down anything…"
                className="pr-20"
                maxLines={4}
                onMaxLinesExceeded={() =>
                  onLimitReached("Try breaking that thought into another item.")
                }
              />
              {item.text.trim() && (
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {item.done && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-background/70 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => update(index, { done: !item.done })}
                    className={`grid h-8 w-8 place-items-center rounded-full transition-all ${item.done ? "bg-[color:var(--mit)]/80 text-[color:var(--mit-foreground)] shadow-soft" : "bg-background/70 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[color:var(--mit)]/70"}`}
                    aria-label={item.done ? "Mark incomplete" : "Mark done"}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

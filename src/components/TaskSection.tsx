import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Play, Plus, X } from "lucide-react";
import { PillTextArea } from "./PillInput";
import { cn } from "@/lib/utils";
import { orderTaskItems, PRIORITIES, PRIORITY_META } from "@/features/planner/priority";
import type { TaskItem } from "@/features/planner/types";

type Tone = "should" | "could";

type Props = {
  title: string;
  hint: string;
  emoji: string;
  tone: Tone;
  items: TaskItem[];
  onChange: (items: TaskItem[]) => void;
  onStartTask: (index: number) => void;
  onLimitReached: (message: string) => void;
  placeholder: string;
  /** When true, the section's icon chip bows (used in MIT-done choreography). */
  iconBow?: boolean;
  iconBowDelay?: number;
};

export function TaskSection({
  title,
  hint,
  emoji,
  tone,
  items,
  onChange,
  onStartTask,
  onLimitReached,
  placeholder,
  iconBow = false,
  iconBowDelay = 0,
}: Props) {
  // Display order: incomplete first (preserve order), completed at bottom.
  const ordered = useMemo(() => orderTaskItems(items), [items]);

  const updateText = (i: number, text: string) => {
    const next = [...items];
    next[i] = { ...next[i], text };
    onChange(next);
  };

  const toggleDone = (i: number) => {
    const next = [...items];
    next[i] = { ...next[i], done: !next[i].done };
    onChange(next);
  };

  const cyclePriority = (i: number) => {
    const next = [...items];
    const current = next[i].priority;
    const currentIndex = PRIORITIES.indexOf(current);
    const priority = PRIORITIES[(currentIndex + 1) % PRIORITIES.length];
    next[i] = { ...next[i], priority };
    onChange(next);
  };

  const add = () => onChange([...items, { text: "", done: false }]);

  const remove = (i: number) => {
    if (items.length === 1) {
      onChange([{ text: "", done: false }]);
      return;
    }
    onChange(items.filter((_, idx) => idx !== i));
  };

  const gradient = tone === "should" ? "bg-gradient-should" : "bg-gradient-could";

  return (
    <motion.section
      layout
      className="rounded-[2rem] bg-card/70 backdrop-blur-sm p-6 md:p-7 shadow-soft border border-white/40"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.span
            className={`grid h-10 w-10 place-items-center rounded-2xl ${gradient} text-xl shadow-pop`}
            aria-hidden
            animate={iconBow ? { rotate: [0, -8, 8, -4, 0] } : { rotate: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.32, 0.72, 0, 1],
              delay: iconBow ? iconBowDelay : 0,
            }}
          >
            {emoji}
          </motion.span>
          <div>
            <h2 className="t-display-sm leading-none">{title}</h2>
            <p className="t-meta text-muted-foreground mt-1">{hint}</p>
          </div>
        </div>
        <motion.button
          onClick={add}
          whileTap={{ scale: 0.85, rotate: -10 }}
          whileHover={{ scale: 1.08, rotate: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 14 }}
          className={`grid h-11 w-11 place-items-center rounded-full ${gradient} text-foreground shadow-pop`}
          aria-label={`Add to ${title}`}
          tabIndex={-1}
        >
          <Plus className="h-5 w-5" strokeWidth={2.8} />
        </motion.button>
      </header>

      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {ordered.map(({ item, originalIndex: i }) => {
            const value = item.text;
            const done = item.done;
            const priority = item.priority;
            const priorityMeta = priority ? PRIORITY_META[priority] : undefined;
            return (
              <motion.li
                key={`${tone}-${i}`}
                layout="position"
                initial={{ opacity: 0, height: 0, scale: 0.92 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.92 }}
                transition={{
                  height: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
                  layout: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
                }}
                className="group relative overflow-hidden rounded-[1.45rem]"
              >
                <PillTextArea
                  tone={tone}
                  value={value}
                  done={done}
                  readOnly={done}
                  autoFocus={!done && i === items.length - 1 && i > 0 && value === ""}
                  onChange={(e) => updateText(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.shiftKey) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const list = e.currentTarget.closest("ul");
                      const inputs = list
                        ? Array.from(
                            list.querySelectorAll<HTMLTextAreaElement>("textarea:not([readonly])"),
                          )
                        : [];
                      const idx = inputs.indexOf(e.currentTarget);
                      const next = inputs[idx + 1];
                      if (next) {
                        next.focus();
                        return;
                      }
                      if (value.trim().length > 0) {
                        const expectedCount =
                          (list
                            ? list.querySelectorAll<HTMLTextAreaElement>("textarea:not([readonly])")
                                .length
                            : 0) + 1;
                        add();
                        let tries = 0;
                        const focusNew = () => {
                          const after = list
                            ? Array.from(
                                list.querySelectorAll<HTMLTextAreaElement>(
                                  "textarea:not([readonly])",
                                ),
                              )
                            : [];
                          if (after.length >= expectedCount) {
                            after[after.length - 1]?.focus();
                            return;
                          }
                          if (tries++ < 20) requestAnimationFrame(focusNew);
                        };
                        requestAnimationFrame(focusNew);
                      }
                      return;
                    }
                    if (e.key === "Backspace" && value === "" && items.length > 1) {
                      e.preventDefault();
                      const list = e.currentTarget.closest("ul");
                      const inputs = list
                        ? Array.from(list.querySelectorAll<HTMLTextAreaElement>("textarea"))
                        : [];
                      const idx = inputs.indexOf(e.currentTarget);
                      const prev = inputs[idx - 1];
                      remove(i);
                      if (prev) {
                        requestAnimationFrame(() => {
                          prev.focus();
                          const len = prev.value.length;
                          try {
                            prev.setSelectionRange(len, len);
                          } catch {
                            /* ignore */
                          }
                        });
                      }
                    }
                  }}
                  placeholder={placeholder}
                  className="pr-28"
                  maxLines={4}
                  onMaxLinesExceeded={() =>
                    onLimitReached("This is getting big. Break it down into another item.")
                  }
                />

                {/* Right-side action: tick (toggle) or X (remove if done) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {value.trim().length > 0 && !done && (
                    <button
                      onClick={() => onStartTask(i)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-background/70 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-card hover:text-foreground"
                      aria-label="Start task"
                      title="Start task"
                      type="button"
                      tabIndex={-1}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </button>
                  )}
                  {value.trim().length > 0 && !done && (
                    <button
                      onClick={() => cyclePriority(i)}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full text-sm font-black transition-all",
                        priorityMeta
                          ? priorityMeta.className
                          : "bg-background/70 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-card hover:text-foreground",
                      )}
                      aria-label={priorityMeta ? priorityMeta.label : "Set priority"}
                      title={priorityMeta ? priorityMeta.label : "Set priority"}
                      type="button"
                      tabIndex={-1}
                    >
                      !
                    </button>
                  )}
                  {done && (
                    <button
                      onClick={() => remove(i)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-background/70 text-muted-foreground transition-all hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Remove"
                      type="button"
                      tabIndex={-1}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {value.trim().length > 0 && (
                    <button
                      onClick={() => toggleDone(i)}
                      className={`grid h-8 w-8 place-items-center rounded-full transition-all ${
                        done
                          ? "bg-[color:var(--mit)]/80 text-[color:var(--mit-foreground)] shadow-soft"
                          : "bg-background/70 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[color:var(--mit)]/70 hover:text-[color:var(--mit-foreground)]"
                      }`}
                      aria-label={done ? "Mark incomplete" : "Mark done"}
                      type="button"
                      tabIndex={-1}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </button>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

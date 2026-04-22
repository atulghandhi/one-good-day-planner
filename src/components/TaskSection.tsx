import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { PillInput } from "./PillInput";
import { smallConfetti } from "@/lib/confetti";
import type { TaskItem } from "@/lib/storage";

type Tone = "should" | "could";

type Props = {
  title: string;
  hint: string;
  emoji: string;
  tone: Tone;
  items: TaskItem[];
  onChange: (items: TaskItem[]) => void;
  placeholder: string;
};

export function TaskSection({
  title,
  hint,
  emoji,
  tone,
  items,
  onChange,
  placeholder,
}: Props) {
  // Display order: incomplete first (preserve order), completed at bottom.
  const ordered = useMemo(() => {
    return items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => {
        if (a.item.done === b.item.done) return 0;
        return a.item.done ? 1 : -1;
      });
  }, [items]);

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

  const add = () => onChange([...items, { text: "", done: false }]);

  const remove = (i: number) => {
    if (items.length === 1) {
      onChange([{ text: "", done: false }]);
      return;
    }
    onChange(items.filter((_, idx) => idx !== i));
  };

  const gradient =
    tone === "should" ? "bg-gradient-should" : "bg-gradient-could";

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
          <span
            className={`grid h-10 w-10 place-items-center rounded-2xl ${gradient} text-xl shadow-pop`}
            aria-hidden
          >
            {emoji}
          </span>
          <div>
            <h2 className="font-display text-xl tracking-tight leading-none">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
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
            return (
              <motion.li
                key={`${tone}-${i}`}
                layout
                initial={{ opacity: 0, height: 0, scale: 0.92 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
                className="group relative overflow-visible"
              >
                <PillInput
                  tone={tone}
                  value={value}
                  done={done}
                  readOnly={done}
                  autoFocus={
                    !done && i === items.length - 1 && i > 0 && value === ""
                  }
                  onChange={(e) => updateText(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const list = e.currentTarget.closest("ul");
                      const inputs = list
                        ? Array.from(
                            list.querySelectorAll<HTMLInputElement>(
                              "input:not([readonly])",
                            ),
                          )
                        : [];
                      const idx = inputs.indexOf(e.currentTarget);
                      const next = inputs[idx + 1];
                      if (next) {
                        next.focus();
                        return;
                      }
                      if (value.trim().length > 0) {
                        add();
                      }
                      return;
                    }
                    if (
                      e.key === "Backspace" &&
                      value === "" &&
                      items.length > 1
                    ) {
                      e.preventDefault();
                      const list = e.currentTarget.closest("ul");
                      const inputs = list
                        ? Array.from(
                            list.querySelectorAll<HTMLInputElement>("input"),
                          )
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
                />

                {/* Right-side action: tick (toggle) or X (remove if done) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
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

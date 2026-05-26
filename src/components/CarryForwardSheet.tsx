import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { isoDate } from "@/features/planner/storage";
import type { RolloverTask } from "@/features/planner/types";

type Props = {
  tasks: RolloverTask[];
  /** Carry forward the previous MIT as today's MIT. */
  onAdoptMit: (task: RolloverTask) => void;
  /** Carry forward a non-MIT task into its appropriate list. */
  onCarry: (task: RolloverTask) => void;
  /** Drop a task — remove from rollover queue without adopting. */
  onLetGo: (task: RolloverTask) => void;
  /** Dismiss the sheet entirely for today without acting on remaining tasks. */
  onDismiss: () => void;
};

const KEY = "ogd:carryForwardShownFor";

/**
 * Soft once-per-day prompt that reframes yesterday's unfinished items as a question,
 * not a debt. Bias is towards letting things go.
 */
export function CarryForwardSheet({ tasks, onAdoptMit, onCarry, onLetGo, onDismiss }: Props) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => isoDate(), []);

  const previousMit = useMemo(() => tasks.find((t) => t.kind === "mit") ?? null, [tasks]);
  const otherTasks = useMemo(() => tasks.filter((t) => t.kind !== "mit"), [tasks]);

  useEffect(() => {
    if (tasks.length === 0) return;
    if (typeof window === "undefined") return;
    let shownToday = false;
    try {
      shownToday = window.localStorage.getItem(KEY) === today;
    } catch {
      shownToday = false;
    }
    if (!shownToday) {
      const timer = window.setTimeout(() => setOpen(true), 1600); // wait for intro
      return () => window.clearTimeout(timer);
    }
  }, [tasks.length, today]);

  const markShown = () => {
    try {
      window.localStorage.setItem(KEY, today);
    } catch {
      /* ignore */
    }
  };

  const handleClose = () => {
    markShown();
    setOpen(false);
    onDismiss();
  };

  if (tasks.length === 0) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] grid place-items-center bg-foreground/25 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-labelledby="carry-forward-title"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[2rem] border border-white/40 bg-card/95 p-6 shadow-pop backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 t-eyebrow text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--mit)]" />
              From yesterday
            </div>

            {previousMit ? (
              <>
                <h2 id="carry-forward-title" className="mt-3 t-display-sm">
                  Yesterday you said this mattered.
                </h2>
                <p className="mt-3 t-body italic text-foreground/80">"{previousMit.text}"</p>
                <p className="mt-3 t-body text-muted-foreground">Still true?</p>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      markShown();
                      onAdoptMit(previousMit);
                      setOpen(false);
                    }}
                    className="rounded-full bg-gradient-mit px-5 py-3 t-body-lg font-semibold text-[color:var(--mit-foreground)] shadow-pop transition hover:scale-[1.01]"
                  >
                    Yes, today's one thing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      markShown();
                      onLetGo(previousMit);
                    }}
                    className="rounded-full bg-card px-5 py-3 t-body text-muted-foreground shadow-soft transition hover:bg-muted/60 hover:text-foreground"
                  >
                    Let it go
                  </button>
                </div>
              </>
            ) : (
              <h2 id="carry-forward-title" className="mt-3 t-display-sm">
                Some things from yesterday.
              </h2>
            )}

            {otherTasks.length > 0 && (
              <div className="mt-6">
                <p className="t-meta text-muted-foreground">Carry forward what's still alive.</p>
                <ul className="mt-3 space-y-2">
                  {otherTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/60 px-3 py-2"
                    >
                      <span className="t-body line-clamp-2 flex-1">{task.text}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            markShown();
                            onCarry(task);
                          }}
                          className="rounded-full bg-card px-3 py-1 t-meta font-semibold text-foreground shadow-soft transition hover:scale-[1.02]"
                        >
                          Carry
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            markShown();
                            onLetGo(task);
                          }}
                          className="rounded-full px-3 py-1 t-meta text-muted-foreground transition hover:text-foreground"
                        >
                          Drop
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="t-meta text-muted-foreground transition hover:text-foreground"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

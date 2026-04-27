import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import {
  EMPTY_STATE,
  type PlannerState,
  type TaskItem,
  clearState,
  loadState,
  saveState,
} from "@/lib/storage";
import { useDebouncedEffect } from "@/hooks/use-debounce";
import { bigConfetti, smallConfetti } from "@/lib/confetti";
import { PillInput } from "./PillInput";
import { MitEditor, mitHasContent } from "./MitEditor";
import { TaskSection } from "./TaskSection";
import { ResetDialog } from "./ResetDialog";
import { ThemePicker } from "./ThemePicker";
import { WeekView } from "./WeekView";
import { GlitterRain } from "./GlitterRain";
import kirbyImg from "@/assets/kirby.png";

const WEEK_LAYOUT_ID = "date-to-week-card";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Focus the next input in the same <ul>; return true if found.
function focusNextSiblingInput(el: HTMLInputElement): boolean {
  const list = el.closest("ul");
  if (!list) return false;
  const inputs = Array.from(list.querySelectorAll<HTMLInputElement>("input"));
  const idx = inputs.indexOf(el);
  const next = inputs[idx + 1];
  if (next) {
    next.focus();
    return true;
  }
  return false;
}

export function Planner() {
  const [state, setState] = useState<PlannerState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(todayLabel());
  }, []);

  // Track mouse position for theme background spotlight effects
  useEffect(() => {
    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.documentElement.style.setProperty("--mx", `${pendingX}px`);
        document.documentElement.style.setProperty("--my", `${pendingY}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadState().then((s) => {
      if (!cancelled) {
        setState(s);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced auto-save
  useDebouncedEffect(
    () => {
      if (hydrated) void saveState(state);
    },
    [state, hydrated],
    400,
  );

  const flushSave = () => {
    if (hydrated) void saveState(state);
  };

  const showSubs = mitHasContent(state.mit);

  // Sort sub-steps so completed ones drop to the bottom (preserve original index for keys + edits)
  const orderedSubs = useMemo(
    () =>
      state.mitSubs
        .map((item, originalIndex) => ({ item, originalIndex }))
        .sort((a, b) => {
          if (a.item.done === b.item.done) return 0;
          return a.item.done ? 1 : -1;
        }),
    [state.mitSubs],
  );

  const handleReset = async () => {
    await clearState();
    setState(EMPTY_STATE);
    setConfirmOpen(false);
  };

  return (
    <div className="relative min-h-screen">
      <GlitterRain />

      {/* Floating playful blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[color:var(--sun)] opacity-60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[color:var(--could)] opacity-50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[color:var(--should)] opacity-50 blur-3xl"
      />

      <main className="relative mx-auto w-full max-w-2xl px-5 py-10 md:py-14">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <motion.button
              type="button"
              onClick={() => setWeekOpen(true)}
              layoutId={WEEK_LAYOUT_ID}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur cursor-pointer hover:bg-card/90"
              aria-label="Open weekly view"
            >
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--mit)]" />
              {dateLabel || "\u00A0"}
            </motion.button>
            <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-tight">
              One good day.
            </h1>
            <p className="mt-2 text-muted-foreground">
              Pick what matters. Let the rest go.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemePicker />
            <motion.button
              onClick={() => setConfirmOpen(true)}
              whileHover={{ rotate: -90, scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="grid h-12 w-12 place-items-center rounded-full bg-card text-foreground shadow-pop"
              aria-label="Reset day"
            >
              <RotateCcw className="h-5 w-5" strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>

        {/* MIT */}
        <motion.section
          layout
          className="rounded-[2.2rem] bg-gradient-mit p-1 shadow-pop"
          transition={{ layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
        >
          <div className="rounded-[2rem] bg-card/90 backdrop-blur p-5 md:p-6">
            <label className="mb-3 block px-2 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--mit-foreground)]">
              ★ The one thing
            </label>
            <PillInput
              tone="mit"
              size="lg"
              value={state.mit}
              onChange={(e) =>
                setState((s) => {
                  const text = e.target.value;
                  const needsSub =
                    text.trim().length > 0 && s.mitSubs.length === 0;
                  return {
                    ...s,
                    mit: text,
                    mitSubs: needsSub
                      ? [{ text: "", done: false }]
                      : s.mitSubs,
                  };
                })
              }
              onKeyDown={(e) => {
                if (
                  (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) &&
                  state.mit.trim().length > 0
                ) {
                  e.preventDefault();
                  // Focus first sub-step input (will be created by onChange if needed)
                  requestAnimationFrame(() => {
                    const root = e.currentTarget?.closest("section");
                    const sub = root?.querySelector<HTMLInputElement>(
                      "ul input:not([readonly])",
                    );
                    sub?.focus();
                  });
                }
              }}
              onBlur={flushSave}
              placeholder="What would make today a win?"
              autoFocus
            />

            {state.mit.trim().length > 0 && !state.mitDone && (
              <div className="mt-3 flex justify-end px-2">
                <motion.button
                  type="button"
                  onClick={(e) => {
                    setState((s) => ({ ...s, mitDone: true }));
                    bigConfetti();
                    (e.currentTarget as HTMLElement).blur();
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  tabIndex={-1}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--mit)]/80 px-3 py-1 text-xs font-semibold text-[color:var(--mit-foreground)] shadow-soft hover:bg-[color:var(--mit)]"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  Done!
                </motion.button>
              </div>
            )}
            {state.mitDone && (
              <div className="mt-3 flex justify-end px-2">
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, mitDone: false }))}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  undo
                </button>
              </div>
            )}
            <AnimatePresence initial={false}>
              {showSubs && (
                <motion.div
                  key="subs"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
                    opacity: { duration: 0.2 },
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pt-5 pb-1">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        Break it down (optional)
                      </p>
                      <motion.button
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            mitSubs: [
                              ...s.mitSubs,
                              { text: "", done: false } as TaskItem,
                            ],
                          }))
                        }
                        whileTap={{ scale: 0.85, rotate: -10 }}
                        whileHover={{ scale: 1.08, rotate: 8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 14 }}
                        className="grid h-9 w-9 place-items-center rounded-full bg-gradient-mit text-foreground shadow-pop"
                        aria-label="Add step"
                        type="button"
                        tabIndex={-1}
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.8} />
                      </motion.button>
                    </div>
                    <ul className="flex flex-col gap-2.5">
                      <AnimatePresence initial={false}>
                        {orderedSubs.map(({ item: sub, originalIndex: i }) => (
                          <motion.li
                            key={i}
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
                            className="group relative overflow-hidden rounded-full"
                          >
                            <PillInput
                              tone="mit"
                              value={sub.text}
                              done={sub.done}
                              readOnly={sub.done}
                              onChange={(e) => {
                                const next = [...state.mitSubs];
                                next[i] = { ...next[i], text: e.target.value };
                                setState((s) => ({ ...s, mitSubs: next }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (focusNextSiblingInput(e.currentTarget)) {
                                    return;
                                  }
                                  if (sub.text.trim().length > 0) {
                                    setState((s) => ({
                                      ...s,
                                      mitSubs: [
                                        ...s.mitSubs,
                                        { text: "", done: false },
                                      ],
                                    }));
                                    requestAnimationFrame(() => {
                                      const list =
                                        e.currentTarget?.closest("ul");
                                      const inputs = list
                                        ? Array.from(
                                            list.querySelectorAll<HTMLInputElement>(
                                              "input:not([readonly])",
                                            ),
                                          )
                                        : [];
                                      inputs[inputs.length - 1]?.focus();
                                    });
                                  }
                                  return;
                                }
                                if (
                                  e.key === "Backspace" &&
                                  sub.text === "" &&
                                  state.mitSubs.length > 1
                                ) {
                                  e.preventDefault();
                                  const list = e.currentTarget.closest("ul");
                                  const inputs = list
                                    ? Array.from(
                                        list.querySelectorAll<HTMLInputElement>(
                                          "input",
                                        ),
                                      )
                                    : [];
                                  const idx = inputs.indexOf(e.currentTarget);
                                  const prev = inputs[idx - 1];
                                  setState((s) => ({
                                    ...s,
                                    mitSubs: s.mitSubs.filter(
                                      (_, idx2) => idx2 !== i,
                                    ),
                                  }));
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
                              onBlur={flushSave}
                              placeholder={`Step ${i + 1}`}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              {sub.done && (
                                <button
                                  onClick={() =>
                                    setState((s) => ({
                                      ...s,
                                      mitSubs: s.mitSubs.filter(
                                        (_, idx) => idx !== i,
                                      ),
                                    }))
                                  }
                                  className="grid h-8 w-8 place-items-center rounded-full bg-background/70 text-muted-foreground transition-all hover:bg-destructive hover:text-destructive-foreground"
                                  aria-label="Remove step"
                                  type="button"
                                  tabIndex={-1}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                              {sub.text.trim().length > 0 && (
                                <button
                                  onClick={(ev) => {
                                    const wasDone = sub.done;
                                    setState((s) => ({
                                      ...s,
                                      mitSubs: s.mitSubs.map((it, idx) =>
                                        idx === i
                                          ? { ...it, done: !it.done }
                                          : it,
                                      ),
                                    }));
                                    if (!wasDone) {
                                      smallConfetti(
                                        "mit",
                                        ev.currentTarget as HTMLElement,
                                      );
                                    }
                                  }}
                                  className={`grid h-8 w-8 place-items-center rounded-full transition-all ${
                                    sub.done
                                      ? "bg-[color:var(--mit)]/80 text-[color:var(--mit-foreground)] shadow-soft"
                                      : "bg-background/70 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[color:var(--mit)]/70 hover:text-[color:var(--mit-foreground)]"
                                  }`}
                                  aria-label={
                                    sub.done ? "Mark incomplete" : "Mark done"
                                  }
                                  type="button"
                                  tabIndex={-1}
                                >
                                  <Check className="h-4 w-4" strokeWidth={3} />
                                </button>
                              )}
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Shoulds + Coulds */}
        <div className="mt-8 flex flex-col gap-6">
          <TaskSection
            title="Shoulds"
            hint="Nice to get done"
            emoji="🌿"
            tone="should"
            items={state.shoulds}
            onChange={(shoulds) => setState((s) => ({ ...s, shoulds }))}
            placeholder="Something you should do…"
          />
          <TaskSection
            title="Coulds"
            hint="If there's time"
            emoji="✨"
            tone="could"
            items={state.coulds}
            onChange={(coulds) => setState((s) => ({ ...s, coulds }))}
            placeholder="Something you could do…"
          />
        </div>

        <footer className="mt-12 flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
          <p>
            <kbd className="rounded bg-card/70 px-1.5 py-0.5 font-mono text-[10px] shadow-soft">Enter</kbd>
            <span className="mx-1.5">next field (or new)</span>
            <span className="opacity-50">·</span>
            <kbd className="ml-1.5 rounded bg-card/70 px-1.5 py-0.5 font-mono text-[10px] shadow-soft">Tab</kbd>
            <span className="ml-1.5">next field</span>
          </p>
          <p>Saved automatically · just for today</p>
        </footer>
      </main>

      <ResetDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReset}
      />

      <WeekView
        open={weekOpen}
        onClose={() => setWeekOpen(false)}
        layoutId={WEEK_LAYOUT_ID}
      />

      {/* Kirby — sits at bottom of page (scroll to find!) on sakura + blossom themes */}
      <img
        src={kirbyImg}
        alt=""
        aria-hidden
        className="kirby pointer-events-none absolute bottom-0 left-2 sm:left-4 z-10 h-20 sm:h-32 md:h-44 lg:h-52 w-auto select-none"
      />
    </div>
  );
}

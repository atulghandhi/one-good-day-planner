import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import {
  EMPTY_STATE,
  type PlannerState,
  clearState,
  loadState,
  saveState,
} from "@/lib/storage";
import { useDebouncedEffect } from "@/hooks/use-debounce";
import { PillInput } from "./PillInput";
import { TaskSection } from "./TaskSection";
import { ResetDialog } from "./ResetDialog";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function Planner() {
  const [state, setState] = useState<PlannerState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(todayLabel());
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

  const showSubs = state.mit.trim().length > 0;

  const handleReset = async () => {
    await clearState();
    setState(EMPTY_STATE);
    setConfirmOpen(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
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
            <div className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--mit)]" />
              {dateLabel || "\u00A0"}
            </div>
            <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-tight">
              One good day.
            </h1>
            <p className="mt-2 text-muted-foreground">
              Pick what matters. Let the rest go.
            </p>
          </div>

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

        {/* MIT */}
        <motion.section
          layout
          className="rounded-[2.2rem] bg-gradient-mit p-1 shadow-pop"
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        >
          <div className="rounded-[2rem] bg-card/90 backdrop-blur p-5 md:p-6">
            <label className="mb-3 block px-2 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--mit-foreground)]">
              ★ The one thing
            </label>
            <PillInput
              tone="mit"
              size="lg"
              value={state.mit}
              onChange={(e) => setState((s) => ({ ...s, mit: e.target.value }))}
              onBlur={flushSave}
              placeholder="What would make today a win?"
              autoFocus
            />

            <AnimatePresence initial={false}>
              {showSubs && (
                <motion.div
                  key="subs"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { type: "spring", stiffness: 200, damping: 26 },
                    opacity: { duration: 0.25 },
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pt-5 pb-1">
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      Break it down (optional)
                    </p>
                    <ul className="flex flex-col gap-2.5">
                      {state.mitSubs.map((sub, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 22,
                            delay: i * 0.06,
                          }}
                        >
                          <PillInput
                            tone="mit"
                            value={sub}
                            onChange={(e) => {
                              const next = [...state.mitSubs];
                              next[i] = e.target.value;
                              setState((s) => ({ ...s, mitSubs: next }));
                            }}
                            onBlur={flushSave}
                            placeholder={`Step ${i + 1}`}
                          />
                        </motion.li>
                      ))}
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

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Saved automatically · just for today
        </footer>
      </main>

      <ResetDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}

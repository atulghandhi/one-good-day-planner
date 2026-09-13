import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Brain, Check, Play, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import type { TaskItem } from "@/features/planner/types";
import { useMitFocus } from "@/features/planner/hooks/useMitFocus";
import { usePlannerState } from "@/features/planner/hooks/usePlannerState";
import { usePointerSpotlight } from "@/features/planner/hooks/usePointerSpotlight";
import { bigConfetti } from "@/lib/confetti";
import { PillTextArea } from "./PillInput";
import { MitEditor, mitHasContent } from "./MitEditor";
import { TaskSection } from "./TaskSection";
import { ResetDialog } from "./ResetDialog";
import { ThemePicker } from "./ThemePicker";
import { WeekView } from "./WeekView";
import { GlitterRain } from "./GlitterRain";
import { RolloverPanel } from "./RolloverPanel";
import {
  DEFAULT_START_MODE_TIMER,
  StartModeOverlay,
  playFinishedSound,
  startModeTargetKey,
  type StartModeTarget,
  type StartModeTimer,
} from "./StartModeOverlay";
import { IntroChoreographyProvider, useIntroStage } from "./IntroChoreography";
import { CarryForwardSheet } from "./CarryForwardSheet";
import { ReflectSheet } from "./ReflectSheet";
import { SendToDevice } from "./SendToDevice";
import { shareToday } from "@/lib/shareImage";
import { playDoneTone } from "@/lib/sound";
import { hasPlannerContent, isoDate } from "@/features/planner/storage";
import kirbyImg from "@/assets/kirby.png";

import { PlannerHelp } from "./PlannerHelp";

const WEEK_LAYOUT_ID = "date-to-week-card";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTimerTime(seconds: number) {
  const minutesLeft = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;
  return `${minutesLeft}:${String(secondsLeft).padStart(2, "0")}`;
}

function timerTone(target: StartModeTarget | null) {
  if (!target || target.kind === "mit") return "mit";
  return target.kind;
}

function timerLabel(
  state: ReturnType<typeof usePlannerState>["state"],
  target: StartModeTarget | null,
) {
  if (!target) return "Focus timer";
  if (target.kind === "mit") return "The one thing";
  const list = target.kind === "should" ? state.shoulds : state.coulds;
  return list[target.index]?.text || "Focus timer";
}

// Focus the next text field in the same <ul>; return true if found.
function focusNextSiblingField(el: HTMLInputElement | HTMLTextAreaElement): boolean {
  const list = el.closest("ul");
  if (!list) return false;
  const inputs = Array.from(
    list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input:not([readonly]), textarea:not([readonly])",
    ),
  );
  const idx = inputs.indexOf(el);
  const next = inputs[idx + 1];
  if (next) {
    next.focus();
    return true;
  }
  return false;
}

export function Planner() {
  return (
    <IntroChoreographyProvider>
      <PlannerInner />
    </IntroChoreographyProvider>
  );
}

function PlannerInner() {
  const intro = useIntroStage();
  const {
    state,
    setState,
    rolloverQueue,
    flushSave,
    resetPlanner,
    claimRolloverTask,
    dropRolloverTask,
  } = usePlannerState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState("");
  const [dateStilled, setDateStilled] = useState(true);
  const [mitCelebrating, setMitCelebrating] = useState(false);
  const [startMode, setStartMode] = useState<StartModeTarget | null>(null);
  const [startTimer, setStartTimer] = useState<StartModeTimer>(DEFAULT_START_MODE_TIMER);
  const [plannerNotice, setPlannerNotice] = useState("");
  const plannerNoticeTimerRef = useRef<number | null>(null);
  const requestMitFocus = useMitFocus(state.mitSubs.length);

  usePointerSpotlight();

  useEffect(() => {
    setDateLabel(todayLabel());
    const todayKey = isoDate();
    const stilledKey = "ogd:dateStilled";
    try {
      const stilledFor = window.localStorage.getItem(stilledKey);
      setDateStilled(stilledFor === todayKey);
    } catch {
      setDateStilled(false);
    }
  }, []);

  const stillDateBubble = useCallback(() => {
    if (dateStilled) return;
    setDateStilled(true);
    try {
      const todayKey = isoDate();
      window.localStorage.setItem("ogd:dateStilled", todayKey);
    } catch {
      /* ignore */
    }
  }, [dateStilled]);

  const showPlannerNotice = useCallback((message: string) => {
    setPlannerNotice(message);
    if (plannerNoticeTimerRef.current !== null) {
      window.clearTimeout(plannerNoticeTimerRef.current);
    }
    plannerNoticeTimerRef.current = window.setTimeout(() => {
      setPlannerNotice("");
      plannerNoticeTimerRef.current = null;
    }, 2400);
  }, []);

  useEffect(
    () => () => {
      if (plannerNoticeTimerRef.current !== null) {
        window.clearTimeout(plannerNoticeTimerRef.current);
      }
    },
    [],
  );

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
    await resetPlanner();
    setStartTimer(DEFAULT_START_MODE_TIMER);
    setStartMode(null);
    setConfirmOpen(false);
  };

  useEffect(() => {
    if (!startTimer.running || startTimer.remainingSeconds <= 0) return;
    const id = window.setInterval(() => {
      setStartTimer((current) => {
        if (!current.running) return current;
        const nextRemaining = Math.max(0, current.remainingSeconds - 1);
        return {
          ...current,
          remainingSeconds: nextRemaining,
          running: nextRemaining > 0,
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [startTimer.remainingSeconds, startTimer.running]);

  useEffect(() => {
    if (startTimer.remainingSeconds > 0 || startTimer.sounded) return;
    setStartTimer((current) => ({ ...current, running: false, sounded: true }));
    playFinishedSound();
  }, [startTimer.remainingSeconds, startTimer.sounded]);

  // Coordinated "MIT done" choreography — runs at most once per day.
  const celebrateMitDone = useCallback(() => {
    const key = "ogd:mitDoneChoreoFor";
    let alreadyFiredToday = false;
    try {
      alreadyFiredToday = window.localStorage.getItem(key) === isoDate();
    } catch {
      /* ignore */
    }
    bigConfetti();
    playDoneTone();
    if (alreadyFiredToday) return;
    try {
      window.localStorage.setItem(key, isoDate());
    } catch {
      /* ignore */
    }
    setMitCelebrating(true);
    window.setTimeout(() => setMitCelebrating(false), 1400);
  }, []);

  return (
    <div className="relative min-h-screen">
      <GlitterRain />
      <RolloverPanel tasks={rolloverQueue} onClaimTask={claimRolloverTask} />
      <MiniTimerCard
        timer={startTimer}
        state={state}
        hidden={!!startMode}
        onOpen={(target) => setStartMode(target)}
      />

      {/* Screen-wide pulse on MIT-done — soft radial bloom from centre */}
      <AnimatePresence>
        {mitCelebrating && (
          <motion.div
            key="mit-pulse"
            aria-hidden
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: [0, 0.55, 0], scale: [0.92, 1.08, 1.12] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-none fixed inset-0 z-[40]"
            style={{
              background:
                "radial-gradient(circle at center, color-mix(in oklab, var(--mit) 55%, transparent) 0%, transparent 55%)",
              mixBlendMode: "soft-light",
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating atmospheric blobs — calm independent drift */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[color:var(--sun)] opacity-35 blur-3xl"
        animate={{ x: [-12, 14, -12], y: [-8, 10, -8] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[color:var(--could)] opacity-30 blur-3xl"
        animate={{ x: [10, -14, 10], y: [12, -8, 12] }}
        transition={{ duration: 31, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[color:var(--should)] opacity-30 blur-3xl"
        animate={{ x: [-8, 12, -8], y: [-6, 8, -6] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      <main
        className="relative mx-auto w-full max-w-2xl px-5 py-10 md:py-14"
        data-intro-stage={intro.stage}
      >
        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <motion.button
              type="button"
              onClick={() => {
                stillDateBubble();
                setWeekOpen(true);
              }}
              layoutId={WEEK_LAYOUT_ID}
              animate={
                dateStilled ? { scale: 1 } : { scale: [1, 1.045, 1], opacity: [0.92, 1, 0.92] }
              }
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              transition={
                dateStilled
                  ? { duration: 0.45, ease: [0.32, 0.72, 0, 1] }
                  : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
              }
              className="feature-pill inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-1.5 t-meta text-foreground shadow-soft backdrop-blur cursor-pointer hover:bg-card"
              aria-label="Open weekly view"
              data-intro-show="2"
            >
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--mit)]" />
              {dateLabel || "\u00A0"}
            </motion.button>
            <Link
              to="/brainstorm"
              data-intro-show="2"
              className="feature-pill ml-2 inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-1.5 t-meta text-foreground shadow-soft backdrop-blur transition hover:bg-card"
              aria-label="Open brainstorm canvas"
            >
              <Brain className="h-3.5 w-3.5 text-[color:var(--mit)]" />
              Brainstorm
            </Link>
            <h1 data-intro-show="3" className="intro-title mt-4 t-display">
              One good day.
            </h1>
            <p data-intro-show="3" className="mt-2 t-body text-muted-foreground">
              Your simple daily planner. Pick what matters. Let the rest go.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemePicker />
            <div className="group relative">
              <motion.button
                onClick={() => setConfirmOpen(true)}
                whileHover={{ rotate: -90, scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="grid h-12 w-12 place-items-center rounded-full bg-card text-foreground shadow-pop"
                aria-label="Reset day"
                title="Reset day"
              >
                <RotateCcw className="h-5 w-5" strokeWidth={2.5} />
              </motion.button>
              <span
                aria-hidden
                className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0"
              >
                Reset day
              </span>
            </div>
          </div>
        </div>

        {/* MIT */}
        <motion.section
          layout
          data-intro-show="4"
          className="rounded-[2.2rem] bg-gradient-mit p-1 shadow-pop"
          animate={mitCelebrating ? { scale: [1, 1.02, 1] } : { scale: 1 }}
          transition={{
            layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
            scale: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
          }}
        >
          <div className="rounded-[2rem] bg-card/90 backdrop-blur p-5 md:p-6">
            <label className="mb-3 block px-2 t-eyebrow text-[color:var(--mit-foreground)]">
              ★ The one thing
            </label>
            <MitEditor
              value={state.mit}
              autoFocus
              done={state.mitDone}
              onChange={(html) =>
                setState((s) => {
                  const needsSub = mitHasContent(html) && s.mitSubs.length === 0;
                  return {
                    ...s,
                    mit: html,
                    mitSubs: needsSub ? [{ text: "", done: false }] : s.mitSubs,
                  };
                })
              }
              onAdvance={() => {
                if (!mitHasContent(state.mit)) return;
                requestMitFocus(0);
                setState((s) =>
                  s.mitSubs.length === 0 ? { ...s, mitSubs: [{ text: "", done: false }] } : s,
                );
              }}
              onBlur={flushSave}
              placeholder="What would make today a win?"
            />

            {mitHasContent(state.mit) && !state.mitDone && (
              <div className="mt-3 flex justify-end gap-2 px-2">
                <motion.button
                  type="button"
                  onClick={(e) => {
                    setStartMode({ kind: "mit" });
                    (e.currentTarget as HTMLElement).blur();
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  tabIndex={-1}
                  className="inline-flex items-center gap-1.5 rounded-full bg-background/75 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-soft transition hover:bg-card hover:text-foreground"
                  aria-label="Start MIT"
                >
                  <Play className="h-3.5 w-3.5 fill-current" strokeWidth={3} />
                  Start
                </motion.button>
                <motion.button
                  type="button"
                  onClick={(e) => {
                    setState((s) => ({ ...s, mitDone: true }));
                    celebrateMitDone();
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
                      <p className="t-meta text-muted-foreground">Break it down (optional)</p>
                      <motion.button
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            mitSubs: [...s.mitSubs, { text: "", done: false } as TaskItem],
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
                            <PillTextArea
                              tone="mit"
                              value={sub.text}
                              done={sub.done}
                              readOnly={sub.done}
                              data-mit-sub-index={i}
                              onChange={(e) => {
                                const next = [...state.mitSubs];
                                next[i] = { ...next[i], text: e.target.value };
                                setState((s) => ({ ...s, mitSubs: next }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && e.shiftKey) return;
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (focusNextSiblingField(e.currentTarget)) {
                                    return;
                                  }
                                  if (sub.text.trim().length > 0) {
                                    const newIndex = state.mitSubs.length;
                                    requestMitFocus(newIndex);
                                    setState((s) => ({
                                      ...s,
                                      mitSubs: [...s.mitSubs, { text: "", done: false }],
                                    }));
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
                                        list.querySelectorAll<HTMLTextAreaElement>("textarea"),
                                      )
                                    : [];
                                  const idx = inputs.indexOf(e.currentTarget);
                                  const prev = inputs[idx - 1];
                                  setState((s) => ({
                                    ...s,
                                    mitSubs: s.mitSubs.filter((_, idx2) => idx2 !== i),
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
                              className="pr-20"
                              maxLines={2}
                              onMaxLinesExceeded={() =>
                                showPlannerNotice("Break this step down into a new step.")
                              }
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              {sub.done && (
                                <button
                                  onClick={() =>
                                    setState((s) => ({
                                      ...s,
                                      mitSubs: s.mitSubs.filter((_, idx) => idx !== i),
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
                                  onClick={() => {
                                    setState((s) => ({
                                      ...s,
                                      mitSubs: s.mitSubs.map((it, idx) =>
                                        idx === i ? { ...it, done: !it.done } : it,
                                      ),
                                    }));
                                  }}
                                  className={`grid h-8 w-8 place-items-center rounded-full transition-all ${
                                    sub.done
                                      ? "bg-[color:var(--mit)]/80 text-[color:var(--mit-foreground)] shadow-soft"
                                      : "bg-background/70 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[color:var(--mit)]/70 hover:text-[color:var(--mit-foreground)]"
                                  }`}
                                  aria-label={sub.done ? "Mark incomplete" : "Mark done"}
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
            onStartTask={(index) => setStartMode({ kind: "should", index })}
            onLimitReached={showPlannerNotice}
            placeholder="Something you should do…"
            iconBow={mitCelebrating}
            iconBowDelay={0}
          />
          <TaskSection
            title="Coulds"
            hint="If there's time"
            emoji="✨"
            tone="could"
            items={state.coulds}
            onChange={(coulds) => setState((s) => ({ ...s, coulds }))}
            onStartTask={(index) => setStartMode({ kind: "could", index })}
            onLimitReached={showPlannerNotice}
            placeholder="Something you could do…"
            iconBow={mitCelebrating}
            iconBowDelay={0.06}
          />
        </div>

        <ReflectSheet state={state} />

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <a
            href="/brainstorm?today=1"
            className="inline-flex items-center gap-1.5 t-meta text-muted-foreground transition hover:text-foreground"
          >
            Map today on the canvas
            <span aria-hidden>→</span>
          </a>
          {hasPlannerContent(state) && (
            <button
              type="button"
              onClick={() => {
                void shareToday(state, isoDate()).catch(() => {
                  showPlannerNotice("Couldn't render the share card.");
                });
              }}
              className="inline-flex items-center gap-1.5 t-meta text-muted-foreground transition hover:text-foreground"
            >
              Share today
              <span aria-hidden>→</span>
            </button>
          )}
          {hasPlannerContent(state) && <SendToDevice state={state} />}
        </div>

        <PlannerHelp />

        <footer className="mt-12 flex flex-col items-center gap-1.5 text-center text-muted-foreground">
          <p className="t-meta">
            <kbd className="rounded bg-card/70 px-1.5 py-0.5 t-mono shadow-soft">Enter</kbd>
            <span className="mx-1.5">next field (or new)</span>
            <span className="opacity-50">·</span>
            <kbd className="ml-1.5 rounded bg-card/70 px-1.5 py-0.5 t-mono shadow-soft">Tab</kbd>
            <span className="ml-1.5">next field</span>
          </p>
          <p className="t-meta">Saved automatically · just for today</p>
          <p className="t-meta">
            <Link to="/diary" className="transition hover:text-foreground">
              Notes
            </Link>
            <span className="mx-2 opacity-50">·</span>
            <Link to="/reflect" className="transition hover:text-foreground">
              Reflections
            </Link>
          </p>
        </footer>
      </main>

      <ResetDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReset}
      />

      <CarryForwardSheet
        tasks={rolloverQueue}
        onAdoptMit={(task) => claimRolloverTask(task)}
        onCarry={(task) => claimRolloverTask(task)}
        onLetGo={(task) => dropRolloverTask(task)}
        onDismiss={() => {
          /* no-op — sheet self-tracks shown-today */
        }}
      />

      <WeekView open={weekOpen} onClose={() => setWeekOpen(false)} layoutId={WEEK_LAYOUT_ID} />

      <StartModeOverlay
        target={startMode}
        timer={startTimer}
        state={state}
        onStateChange={setState}
        onTimerChange={setStartTimer}
        onLimitReached={showPlannerNotice}
        onClose={() => setStartMode(null)}
      />

      <AnimatePresence>
        {plannerNotice && (
          <motion.div
            className="fixed left-1/2 top-5 z-[95] max-w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-full border border-white/45 bg-card/92 px-4 py-2 text-center text-sm font-semibold text-foreground shadow-pop backdrop-blur"
            initial={{ opacity: 0, y: -12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            {plannerNotice}
          </motion.div>
        )}
      </AnimatePresence>

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

function MiniTimerCard({
  timer,
  state,
  hidden,
  onOpen,
}: {
  timer: StartModeTimer;
  state: ReturnType<typeof usePlannerState>["state"];
  hidden: boolean;
  onOpen: (target: StartModeTarget) => void;
}) {
  const target = timer.target;
  const shouldShow = timer.running && !!target && !hidden;
  const tone = timerTone(target);
  const label = timerLabel(state, target);
  const targetKey = startModeTargetKey(target);

  return (
    <AnimatePresence>
      {shouldShow && target && (
        <motion.button
          key={targetKey}
          type="button"
          onClick={() => onOpen(target)}
          initial={{ opacity: 0, y: -16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.92 }}
          whileHover={{ y: -2, scale: 1.025 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed right-5 top-5 z-[65] grid h-28 w-28 place-items-center overflow-hidden rounded-[1.65rem] border border-white/55 bg-card/86 p-3 text-center text-foreground shadow-pop backdrop-blur-xl md:right-8 md:top-8"
          aria-label="Open running focus timer"
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 opacity-55"
            style={{
              background: `radial-gradient(circle at 50% 35%, color-mix(in oklab, var(--${tone}) 32%, transparent), transparent 66%)`,
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.42, 0.62, 0.42] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span
            aria-hidden
            className="absolute inset-2 rounded-[1.35rem] border"
            style={{ borderColor: `color-mix(in oklab, var(--${tone}) 42%, transparent)` }}
          />
          <span className="relative z-10 flex min-w-0 flex-col items-center gap-1">
            <span
              className="font-sans text-[2rem] font-light leading-none tabular-nums"
              style={{ color: `var(--${tone})`, letterSpacing: "0" }}
            >
              {formatTimerTime(timer.remainingSeconds)}
            </span>
            <span className="line-clamp-2 max-w-20 text-[0.65rem] font-bold leading-tight text-muted-foreground">
              {label}
            </span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

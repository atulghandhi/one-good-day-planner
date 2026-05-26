import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type PointerEvent,
  type SetStateAction,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pause, Play, X } from "lucide-react";
import { PillTextArea } from "./PillInput";
import { htmlToPlainText, plainTextToMitHtml, taskHasText } from "@/features/planner/text";
import type { PlannerState, TaskItem } from "@/features/planner/types";
import { cn } from "@/lib/utils";

export type StartModeTarget =
  | { kind: "mit" }
  | { kind: "should"; index: number }
  | { kind: "could"; index: number };

export type StartModeTimer = {
  target: StartModeTarget | null;
  minutes: number;
  remainingSeconds: number;
  running: boolean;
  sounded: boolean;
};

type StartModeOverlayProps = {
  target: StartModeTarget | null;
  timer: StartModeTimer;
  state: PlannerState;
  onStateChange: Dispatch<SetStateAction<PlannerState>>;
  onTimerChange: Dispatch<SetStateAction<StartModeTimer>>;
  onLimitReached: (message: string) => void;
  onClose: () => void;
};

const TIMER_MAX_MINUTES = 59;
const TIMER_MIN_MINUTES = 1;
const DEFAULT_MINUTES = 25;
const DIAL_CENTER = 100;
const DIAL_RADIUS = 78;
const DIAL_MINUTE_RANGE = 60;

export const DEFAULT_START_MODE_TIMER: StartModeTimer = {
  target: null,
  minutes: DEFAULT_MINUTES,
  remainingSeconds: DEFAULT_MINUTES * 60,
  running: false,
  sounded: false,
};

export function startModeTargetKey(target: StartModeTarget | null) {
  if (!target) return "";
  return `${target.kind}-${"index" in target ? target.index : "main"}`;
}

export function playFinishedSound() {
  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.18);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.52);
}

function clampMinutes(value: number) {
  return Math.min(TIMER_MAX_MINUTES, Math.max(TIMER_MIN_MINUTES, value));
}

function toneForTarget(target: StartModeTarget) {
  if (target.kind === "mit") return "mit";
  return target.kind;
}

function updateListTask(
  state: PlannerState,
  target: Extract<StartModeTarget, { kind: "should" | "could" }>,
  update: (item: TaskItem) => TaskItem,
) {
  const key = target.kind === "should" ? "shoulds" : "coulds";
  return {
    ...state,
    [key]: state[key].map((item, index) => (index === target.index ? update(item) : item)),
  };
}

export function StartModeOverlay({
  target,
  timer,
  state,
  onStateChange,
  onTimerChange,
  onLimitReached,
  onClose,
}: StartModeOverlayProps) {
  const [draggingTimer, setDraggingTimer] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const targetKey = startModeTargetKey(target);
  const timerTargetKey = startModeTargetKey(timer.target);

  const current = useMemo(() => {
    if (!target) return null;
    if (target.kind === "mit") {
      return {
        tone: toneForTarget(target),
        text: htmlToPlainText(state.mit),
        steps: state.mitSubs,
        done: state.mitDone,
      };
    }
    const item = state[target.kind === "should" ? "shoulds" : "coulds"][target.index];
    if (!item) return null;
    return {
      tone: toneForTarget(target),
      text: item.text,
      steps: item.steps ?? [],
      done: item.done,
    };
  }, [state, target]);

  useEffect(() => {
    if (!target) return;
    if (timerTargetKey !== targetKey) {
      onTimerChange({
        target,
        minutes: DEFAULT_MINUTES,
        remainingSeconds: DEFAULT_MINUTES * 60,
        running: false,
        sounded: false,
      });
    }
    setDraggingTimer(false);
  }, [onTimerChange, target, targetKey, timerTargetKey]);

  const setTimerMinutes = useCallback(
    (next: number) => {
      const clamped = clampMinutes(next);
      onTimerChange((currentTimer) => ({
        ...currentTimer,
        target,
        minutes: clamped,
        remainingSeconds: clamped * 60,
        running: false,
        sounded: false,
      }));
    },
    [onTimerChange, target],
  );

  const setTimerFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = dialRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clientX - (rect.left + rect.width / 2);
      const y = clientY - (rect.top + rect.height / 2);
      const angle = (Math.atan2(y, x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      const nextMinutes = Math.round((angle / (Math.PI * 2)) * DIAL_MINUTE_RANGE);
      setTimerMinutes(nextMinutes <= 0 ? TIMER_MAX_MINUTES : nextMinutes);
    },
    [setTimerMinutes],
  );

  const handleDialPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingTimer(true);
    setTimerFromPointer(event.clientX, event.clientY);
  };

  const handleDialPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!draggingTimer) return;
    event.preventDefault();
    event.stopPropagation();
    setTimerFromPointer(event.clientX, event.clientY);
  };

  const handleDialPointerEnd = (event: PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingTimer(false);
  };

  const handleDialKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setTimerMinutes(timer.minutes + 1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setTimerMinutes(timer.minutes - 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      setTimerMinutes(TIMER_MIN_MINUTES);
    }
    if (event.key === "End") {
      event.preventDefault();
      setTimerMinutes(TIMER_MAX_MINUTES);
    }
  };

  const toggleTimer = () => {
    onTimerChange((currentTimer) => {
      const remainingSeconds =
        !currentTimer.running && currentTimer.remainingSeconds <= 0
          ? currentTimer.minutes * 60
          : currentTimer.remainingSeconds;

      return {
        ...currentTimer,
        target,
        remainingSeconds,
        running: !currentTimer.running,
        sounded: false,
      };
    });
  };

  const updateTaskText = (text: string) => {
    if (!target) return;
    onStateChange((currentState) => {
      if (target.kind === "mit") {
        return { ...currentState, mit: plainTextToMitHtml(text) };
      }
      return updateListTask(currentState, target, (item) => ({ ...item, text }));
    });
  };

  const updateSteps = (update: (steps: TaskItem[]) => TaskItem[]) => {
    if (!target) return;
    onStateChange((currentState) => {
      if (target.kind === "mit") {
        return { ...currentState, mitSubs: update(currentState.mitSubs) };
      }
      return updateListTask(currentState, target, (item) => ({
        ...item,
        steps: update(item.steps ?? []),
      }));
    });
  };

  const steps = current?.steps.length ? current.steps : [{ text: "", done: false }];
  const circumference = 2 * Math.PI * DIAL_RADIUS;
  const dialProgress = Math.max(0, Math.min(1, timer.remainingSeconds / 60 / DIAL_MINUTE_RANGE));
  const knobAngle = dialProgress * Math.PI * 2 - Math.PI / 2;
  const knobX = DIAL_CENTER + Math.cos(knobAngle) * DIAL_RADIUS;
  const knobY = DIAL_CENTER + Math.sin(knobAngle) * DIAL_RADIUS;
  const minutesLeft = Math.floor(timer.remainingSeconds / 60);
  const secondsLeft = timer.remainingSeconds % 60;
  const showTimerSeconds = timer.running || secondsLeft > 0;
  const displayTime = showTimerSeconds
    ? `${minutesLeft}:${String(secondsLeft).padStart(2, "0")}`
    : String(minutesLeft || timer.minutes);
  const dialTicks = useMemo(
    () =>
      Array.from({ length: DIAL_MINUTE_RANGE }, (_, minute) => {
        const angle = (minute / DIAL_MINUTE_RANGE) * Math.PI * 2 - Math.PI / 2;
        const isMajor = minute % 15 === 0;
        const isMedium = minute % 5 === 0;
        const outerRadius = 93;
        const innerRadius = isMajor ? 80 : isMedium ? 84 : 88;
        return {
          minute,
          x1: DIAL_CENTER + Math.cos(angle) * innerRadius,
          y1: DIAL_CENTER + Math.sin(angle) * innerRadius,
          x2: DIAL_CENTER + Math.cos(angle) * outerRadius,
          y2: DIAL_CENTER + Math.sin(angle) * outerRadius,
          opacity: isMajor ? 0.56 : isMedium ? 0.34 : 0.2,
          strokeWidth: isMajor ? 1.8 : 1.15,
        };
      }),
    [],
  );
  const dialLabels = [
    { label: "60", x: DIAL_CENTER, y: 24 },
    { label: "15", x: 177, y: 105 },
    { label: "30", x: DIAL_CENTER, y: 183 },
    { label: "45", x: 23, y: 105 },
  ];
  const tone = (current?.tone ?? "mit") as "mit" | "should" | "could";
  const toneColor = `var(--${tone})`;
  const toneForeground = `var(--${tone}-foreground)`;

  const updateStepText = (index: number, text: string) => {
    updateSteps((currentSteps) => {
      const next = currentSteps.length > 0 ? [...currentSteps] : [{ text: "", done: false }];
      next[index] = {
        ...(next[index] ?? { done: false, text: "" }),
        text,
      };
      return next;
    });
  };

  const focusStepAt = (index: number) => {
    requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>(`[data-start-step-index="${index}"]`)?.focus();
    });
  };

  const addStepAfter = (index: number) => {
    updateSteps((currentSteps) => {
      const next = currentSteps.length > 0 ? [...currentSteps] : [{ text: "", done: false }];
      next.splice(index + 1, 0, { text: "", done: false });
      return next;
    });
    focusStepAt(index + 1);
  };

  return (
    <AnimatePresence>
      {target && current && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-foreground/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-4xl rounded-[2.25rem] bg-gradient-sky p-1 shadow-pop"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ rotateY: -180, scale: 0.62, opacity: 0 }}
            animate={{ rotateY: 0, scale: 1, opacity: 1 }}
            exit={{ rotateY: 180, scale: 0.62, opacity: 0 }}
            transition={{ duration: 0.62, ease: [0.32, 0.72, 0, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rounded-[2rem] bg-card/94 p-5 backdrop-blur md:p-7">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-background/75 text-muted-foreground shadow-soft transition hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Close focus mode"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="grid gap-7 md:grid-cols-[230px_1fr] md:items-center">
                <section className="flex flex-col items-center justify-center pt-8 md:min-h-[22rem] md:pt-0">
                  <div
                    ref={dialRef}
                    className={cn(
                      "relative grid h-56 w-56 place-items-center rounded-full transition-transform md:h-64 md:w-64",
                      draggingTimer && "scale-[1.015]",
                    )}
                  >
                    <div
                      className="absolute inset-1 rounded-full opacity-55 blur-2xl"
                      style={{
                        background: `radial-gradient(circle, color-mix(in srgb, ${toneColor} 24%, transparent), transparent 62%)`,
                      }}
                    />
                    <motion.div
                      className="absolute inset-5 rounded-full border"
                      style={{
                        borderColor: toneColor,
                        boxShadow: `0 0 36px color-mix(in srgb, ${toneColor} 18%, transparent)`,
                      }}
                      animate={
                        timer.running
                          ? { opacity: [0.16, 0.34, 0.16], scale: [0.99, 1.025, 0.99] }
                          : { opacity: draggingTimer ? 0.34 : 0.18, scale: 1 }
                      }
                      transition={{
                        duration: 4.2,
                        repeat: timer.running ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                    />
                    <svg
                      className={cn(
                        "relative z-10 h-full w-full touch-none select-none rounded-full outline-none",
                        draggingTimer ? "cursor-grabbing" : "cursor-grab",
                      )}
                      viewBox="0 0 200 200"
                      role="slider"
                      aria-label="Timer dial"
                      aria-valuemin={TIMER_MIN_MINUTES}
                      aria-valuemax={TIMER_MAX_MINUTES}
                      aria-valuenow={timer.minutes}
                      aria-valuetext={`${timer.minutes} minutes`}
                      tabIndex={0}
                      onPointerDown={handleDialPointerDown}
                      onPointerMove={handleDialPointerMove}
                      onPointerUp={handleDialPointerEnd}
                      onPointerCancel={handleDialPointerEnd}
                      onLostPointerCapture={() => setDraggingTimer(false)}
                      onKeyDown={handleDialKeyDown}
                    >
                      <circle
                        cx={DIAL_CENTER}
                        cy={DIAL_CENTER}
                        r="94"
                        fill="none"
                        stroke={toneColor}
                        strokeWidth="1"
                        opacity="0.16"
                      />
                      {dialTicks.map((tick) => (
                        <line
                          key={tick.minute}
                          x1={tick.x1}
                          y1={tick.y1}
                          x2={tick.x2}
                          y2={tick.y2}
                          stroke={toneColor}
                          strokeLinecap="round"
                          strokeWidth={tick.strokeWidth}
                          opacity={tick.opacity}
                        />
                      ))}
                      {dialLabels.map((label) => (
                        <text
                          key={label.label}
                          x={label.x}
                          y={label.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={toneColor}
                          opacity="0.48"
                          fontSize="12"
                          fontWeight="800"
                        >
                          {label.label}
                        </text>
                      ))}
                      <circle
                        cx={DIAL_CENTER}
                        cy={DIAL_CENTER}
                        r={DIAL_RADIUS}
                        fill="none"
                        stroke={toneColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - dialProgress)}
                        transform={`rotate(-90 ${DIAL_CENTER} ${DIAL_CENTER})`}
                        style={{
                          transition: draggingTimer ? "none" : "stroke-dashoffset 0.35s ease",
                        }}
                      />
                      <circle
                        cx={knobX}
                        cy={knobY}
                        r={draggingTimer ? "5.4" : "4.4"}
                        fill="hsl(var(--background))"
                        stroke={toneColor}
                        strokeWidth="3"
                        style={{
                          transition: draggingTimer
                            ? "none"
                            : "cx 0.35s ease, cy 0.35s ease, r 0.2s ease",
                          filter: `drop-shadow(0 0 10px color-mix(in srgb, ${toneColor} 42%, transparent))`,
                        }}
                      />
                    </svg>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleTimer();
                      }}
                      className={cn(
                        "group absolute z-20 grid h-36 w-36 place-items-center rounded-full text-center outline-none transition focus-visible:outline-none md:h-40 md:w-40",
                        timer.running && "scale-[1.015]",
                      )}
                      aria-label={timer.running ? "Pause timer" : "Start timer"}
                    >
                      <span className="absolute inset-0 rounded-full bg-card/70 shadow-soft backdrop-blur-sm" />
                      <span
                        className="absolute inset-0 rounded-full border-2 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                        style={{
                          borderColor: toneColor,
                          background: `radial-gradient(circle, color-mix(in srgb, ${toneColor} 16%, transparent), transparent 66%)`,
                          boxShadow: `0 0 32px color-mix(in srgb, ${toneColor} 34%, transparent)`,
                        }}
                      />
                      <span
                        className={cn(
                          "pointer-events-none absolute grid h-24 w-24 place-items-center rounded-full opacity-10 transition duration-200 group-hover:opacity-20 md:h-28 md:w-28",
                          timer.running && "opacity-20",
                        )}
                        style={{ color: toneColor }}
                      >
                        {timer.running ? (
                          <Pause className="h-12 w-12 md:h-14 md:w-14" strokeWidth={1.5} />
                        ) : (
                          <Play
                            className="h-16 w-16 translate-x-0.5 fill-current md:h-20 md:w-20"
                            strokeWidth={1.2}
                          />
                        )}
                      </span>
                      <span className="absolute inset-0 z-10 flex items-center justify-center">
                        <span
                          className={cn(
                            "whitespace-nowrap font-sans leading-none tabular-nums",
                            showTimerSeconds
                              ? "text-4xl md:text-[2.9rem]"
                              : "text-[3.9rem] md:text-[4.75rem]",
                          )}
                          style={{
                            color: toneColor,
                            fontFeatureSettings: '"tnum" 1, "lnum" 1',
                            fontWeight: 200,
                            letterSpacing: "0",
                          }}
                        >
                          {displayTime}
                        </span>
                      </span>
                    </button>
                  </div>
                </section>

                <section className="min-w-0 pr-0 md:pr-8">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em]",
                      tone === "mit"
                        ? "bg-[color:var(--mit)]/18 text-[color:var(--mit-foreground)]"
                        : tone === "should"
                          ? "bg-[color:var(--should)]/18 text-[color:var(--should-foreground)]"
                          : "bg-[color:var(--could)]/18 text-[color:var(--could-foreground)]",
                    )}
                  >
                    Current task
                  </span>

                  <PillTextArea
                    tone={tone}
                    value={current.text}
                    onChange={(event) => updateTaskText(event.target.value)}
                    className="mt-4 min-h-20 text-xl font-bold"
                    placeholder="Current task"
                  />

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Steps
                    </p>
                  </div>

                  <ul className="mt-3 space-y-2">
                    {steps.map((step, index) => (
                      <li key={`${targetKey}-step-${index}`} className="group relative">
                        <PillTextArea
                          tone={tone}
                          value={step.text}
                          done={step.done}
                          readOnly={step.done}
                          data-start-step-index={index}
                          onChange={(event) => updateStepText(index, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && event.shiftKey) return;
                            if (event.key === "Enter") {
                              event.preventDefault();
                              if (taskHasText(step.text)) addStepAfter(index);
                              return;
                            }
                            if (event.key === "Backspace" && step.text === "" && steps.length > 1) {
                              event.preventDefault();
                              updateSteps((currentSteps) =>
                                currentSteps.filter((_, itemIndex) => itemIndex !== index),
                              );
                              focusStepAt(Math.max(0, index - 1));
                            }
                          }}
                          className="pr-20 text-sm"
                          maxLines={2}
                          onMaxLinesExceeded={() =>
                            onLimitReached("Break this step down into a new step.")
                          }
                          placeholder={`Step ${index + 1}`}
                        />
                        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                          {taskHasText(step.text) && (
                            <button
                              type="button"
                              onClick={() =>
                                updateSteps((currentSteps) =>
                                  currentSteps.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, done: !item.done } : item,
                                  ),
                                )
                              }
                              className={cn(
                                "grid h-8 w-8 place-items-center rounded-full transition",
                                step.done
                                  ? "text-background shadow-soft"
                                  : "bg-background/70 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-card hover:text-foreground",
                              )}
                              style={
                                step.done
                                  ? { backgroundColor: toneColor, color: toneForeground }
                                  : undefined
                              }
                              aria-label={step.done ? "Mark step incomplete" : "Mark step done"}
                            >
                              <Check className="h-4 w-4" strokeWidth={3} />
                            </button>
                          )}
                          {steps.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                updateSteps((currentSteps) =>
                                  currentSteps.filter((_, itemIndex) => itemIndex !== index),
                                )
                              }
                              className="grid h-8 w-8 place-items-center rounded-full bg-background/70 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                              aria-label="Remove step"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

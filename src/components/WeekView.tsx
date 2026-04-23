import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import {
  type DaySnapshot,
  isoDate,
  loadHistory,
  weekDates,
} from "@/lib/storage";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Stable layoutId shared with the trigger button for the morph animation. */
  layoutId: string;
};

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayHeading(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function TaskRow({ text, done }: { text: string; done: boolean }) {
  if (!text.trim()) return null;
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        className={`mt-1 grid h-4 w-4 flex-none place-items-center rounded-full ${
          done
            ? "bg-[color:var(--mit)]/80 text-[color:var(--mit-foreground)]"
            : "bg-background/60 text-muted-foreground/70"
        }`}
        aria-hidden
      >
        {done ? (
          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
        ) : (
          <X className="h-2.5 w-2.5" strokeWidth={3} />
        )}
      </span>
      <span
        className={
          done
            ? "leading-snug"
            : "leading-snug text-muted-foreground line-through decoration-muted-foreground/40"
        }
      >
        {text}
      </span>
    </li>
  );
}

function DayCard({
  date,
  snap,
  isToday,
  isFuture,
}: {
  date: Date;
  snap: DaySnapshot | undefined;
  isToday: boolean;
  isFuture: boolean;
}) {
  const dow = DOW[(date.getDay() + 6) % 7];
  const num = date.getDate();

  const hasContent =
    snap &&
    (snap.mit.trim() ||
      snap.mitSubs.some((i) => i.text.trim()) ||
      snap.shoulds.some((i) => i.text.trim()) ||
      snap.coulds.some((i) => i.text.trim()));

  return (
    <div
      className={`relative rounded-3xl p-4 transition-all ${
        isToday
          ? "bg-gradient-mit shadow-pop ring-2 ring-[color:var(--mit)]/60"
          : isFuture
            ? "bg-card/40 border border-border/50"
            : "bg-card/80 border border-border/60 shadow-soft"
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <div
          className={`text-xs font-bold uppercase tracking-widest ${
            isToday
              ? "text-[color:var(--mit-foreground)]"
              : "text-muted-foreground"
          }`}
        >
          {dow}
          {isToday && <span className="ml-1.5 lowercase">· today</span>}
        </div>
        <div
          className={`font-display text-2xl leading-none ${
            isToday ? "text-[color:var(--mit-foreground)]" : ""
          }`}
        >
          {num}
        </div>
      </div>

      {isFuture ? (
        <p className="text-xs italic text-muted-foreground/70">
          Yet to come ✨
        </p>
      ) : !hasContent ? (
        <p className="text-xs italic text-muted-foreground/70">
          A quiet day.
        </p>
      ) : (
        <div className="space-y-3">
          {snap!.mit.trim() && (
            <div>
              <div
                className={`mb-1 text-[10px] font-bold uppercase tracking-widest ${
                  isToday
                    ? "text-[color:var(--mit-foreground)]/80"
                    : "text-[color:var(--mit-foreground)]/80"
                }`}
              >
                ★ The one thing
              </div>
              <TaskRow text={snap!.mit} done={snap!.mitDone} />
              {snap!.mitSubs.length > 0 && (
                <ul className="mt-1 ml-5 space-y-0.5">
                  {snap!.mitSubs.map((s, i) => (
                    <TaskRow key={i} text={s.text} done={s.done} />
                  ))}
                </ul>
              )}
            </div>
          )}
          {snap!.shoulds.some((s) => s.text.trim()) && (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--should-foreground)]/80">
                🌿 Shoulds
              </div>
              <ul className="space-y-0.5">
                {snap!.shoulds.map((s, i) => (
                  <TaskRow key={i} text={s.text} done={s.done} />
                ))}
              </ul>
            </div>
          )}
          {snap!.coulds.some((s) => s.text.trim()) && (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--could-foreground)]/80">
                ✨ Coulds
              </div>
              <ul className="space-y-0.5">
                {snap!.coulds.map((s, i) => (
                  <TaskRow key={i} text={s.text} done={s.done} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WeekView({ open, onClose, layoutId }: Props) {
  const [history, setHistory] = useState<Record<string, DaySnapshot>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadHistory().then((h) => {
      if (!cancelled) setHistory(h);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const today = isoDate();
  const days = weekDates();
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="weekview-backdrop"
          initial={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
          animate={{ backdropFilter: "blur(14px)", backgroundColor: "rgba(0,0,0,0.25)" }}
          exit={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8"
          style={{ WebkitBackdropFilter: "blur(14px)" }}
        >
          <motion.div
            layoutId={layoutId}
            onClick={(e) => e.stopPropagation()}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-3xl rounded-[2rem] bg-card/95 backdrop-blur-xl shadow-pop border border-white/40 overflow-hidden"
          >
            <div className="relative p-6 md:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-[color:var(--mit)]" />
                    {dayHeading(todayDate)}
                  </div>
                  <h2 className="mt-3 font-display text-3xl md:text-4xl tracking-tight">
                    This week
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Monday to Sunday · resets every Monday morning.
                  </p>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ rotate: 90, scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="grid h-11 w-11 flex-none place-items-center rounded-full bg-card text-foreground shadow-pop"
                  aria-label="Close week view"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </motion.button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.3 }}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {days.map((d) => {
                  const key = isoDate(d);
                  const isToday = key === today;
                  const isFuture = d.getTime() > todayDate.getTime();
                  return (
                    <DayCard
                      key={key}
                      date={d}
                      snap={history[key]}
                      isToday={isToday}
                      isFuture={isFuture}
                    />
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

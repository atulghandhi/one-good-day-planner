import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { htmlToPlainText } from "@/features/planner/text";
import { isoDate } from "@/features/planner/storage";
import { loadReflections, saveReflection } from "@/features/planner/reflections";
import type { PlannerState, Reflection } from "@/features/planner/types";

type Props = {
  state: PlannerState;
};

/**
 * Quiet end-of-day reflection. Renders a small footer card only when the MIT is
 * marked done, or when the user already wrote a reflection today. One free-text
 * field, no rubric, no streaks.
 */
export function ReflectSheet({ state }: Props) {
  const today = isoDate();
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadReflections().then((map) => {
      if (cancelled) return;
      const r = map[today] ?? null;
      setReflection(r);
      setDraft(r?.text ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [today]);

  const visible = state.mitDone || reflection !== null;
  if (!visible) return null;

  const mitPlain = htmlToPlainText(state.mit).trim();

  const save = async () => {
    const next: Reflection = {
      date: today,
      text: draft.trim(),
      mitDone: state.mitDone,
      mitText: mitPlain || undefined,
      createdAt: reflection?.createdAt ?? Date.now(),
    };
    await saveReflection(next);
    setReflection(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="mt-8 rounded-[2rem] border border-white/40 bg-card/70 p-6 shadow-soft backdrop-blur"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <div className="t-eyebrow text-muted-foreground">Reflect</div>
          <p className="mt-2 t-display-sm">
            {reflection ? "How today landed." : "How did today land?"}
          </p>
          {reflection && !open && (
            <p className="mt-2 t-body italic text-foreground/80 line-clamp-2">
              "{reflection.text || "—"}"
            </p>
          )}
        </div>
        <span className="t-meta text-muted-foreground">
          {open ? "close" : reflection ? "edit" : "open"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="reflect-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden"
          >
            <div className="pt-5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="A word, a sentence, a feeling — whatever fits."
                className="w-full resize-none rounded-2xl border border-border/60 bg-background/70 px-4 py-3 t-body outline-none shadow-soft transition focus:ring-4 focus:ring-[color:var(--mit)]/40"
                rows={3}
              />
              <div className="mt-3 flex items-center justify-between">
                <Link
                  to="/reflect"
                  className="t-meta text-muted-foreground transition hover:text-foreground"
                >
                  See past days →
                </Link>
                <div className="flex items-center gap-2">
                  {saved && <span className="t-meta text-muted-foreground">saved.</span>}
                  <button
                    type="button"
                    onClick={save}
                    className="rounded-full bg-gradient-mit px-4 py-2 t-meta font-semibold text-[color:var(--mit-foreground)] shadow-soft transition hover:scale-[1.02]"
                  >
                    Save reflection
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

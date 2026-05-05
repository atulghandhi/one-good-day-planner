import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { GlitterRain } from "./GlitterRain";
import { ThemePicker } from "./ThemePicker";

type Idea = { id: string; text: string };
type BrainstormState = { title: string; ideas: Idea[] };

const STORAGE_KEY = "one-good-day:brainstorm:v1";
const EMPTY: BrainstormState = { title: "Options", ideas: [] };

function loadBrainstorm(): BrainstormState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BrainstormState;
  } catch {
    /* ignore */
  }
  return EMPTY;
}

function saveBrainstorm(s: BrainstormState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

// Place ideas around a circle. Returns x,y as percentages from center.
function nodePosition(index: number, total: number) {
  // Stable angle per index — golden-angle scatter so adding new ones spreads nicely.
  const golden = 137.50776; // degrees
  const angle = (index * golden - 90) * (Math.PI / 180);
  // Alternate radii to avoid clumps
  const ring = index % 3; // 0,1,2
  const radius = 32 + ring * 6; // % from center
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

export function Brainstorm() {
  const [state, setState] = useState<BrainstormState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setState(loadBrainstorm());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveBrainstorm(state);
  }, [state, hydrated]);

  // Mouse spotlight tracking (matches Planner)
  useEffect(() => {
    let raf = 0;
    let px = 0;
    let py = 0;
    const onMove = (e: MouseEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.documentElement.style.setProperty("--mx", `${px}px`);
        document.documentElement.style.setProperty("--my", `${py}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const addIdea = () => {
    const text = draft.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      ideas: [
        ...s.ideas,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text },
      ],
    }));
    setDraft("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeIdea = (id: string) => {
    setState((s) => ({ ...s, ideas: s.ideas.filter((i) => i.id !== id) }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GlitterRain />

      {/* Floating playful blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[color:var(--could)] opacity-60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -right-24 h-80 w-80 rounded-full bg-[color:var(--mit)] opacity-50 blur-3xl"
      />

      <main className="relative mx-auto w-full max-w-5xl px-5 py-8 md:py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur hover:bg-card/90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to today
          </Link>
          <ThemePicker />
        </div>

        <div className="mb-4 text-center">
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">
            Brainstorm
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Type an idea, hit enter, watch it orbit.
          </p>
        </div>

        {/* Canvas */}
        <div className="relative mx-auto aspect-square w-full max-w-[680px] rounded-[2rem] bg-card/50 backdrop-blur shadow-pop overflow-hidden">
          {/* SVG lines from center to each node */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {state.ideas.map((idea, i) => {
              const { x, y } = nodePosition(i, state.ideas.length);
              return (
                <motion.line
                  key={idea.id}
                  x1={50}
                  y1={50}
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={0.25}
                  strokeLinecap="round"
                  className="text-[color:var(--mit)] opacity-60"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                />
              );
            })}
          </svg>

          {/* Center editable title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="rounded-full bg-gradient-mit p-1 shadow-pop"
            >
              <input
                value={state.title}
                onChange={(e) =>
                  setState((s) => ({ ...s, title: e.target.value }))
                }
                onFocus={(e) => e.currentTarget.select()}
                className="w-44 rounded-full bg-card/95 px-5 py-3 text-center font-display text-xl font-semibold tracking-tight text-foreground outline-none focus:ring-2 focus:ring-[color:var(--mit)]"
                aria-label="Brainstorm title"
              />
            </motion.div>
          </div>

          {/* Idea nodes */}
          <AnimatePresence>
            {state.ideas.map((idea, i) => {
              const { x, y } = nodePosition(i, state.ideas.length);
              return (
                <motion.div
                  key={idea.id}
                  className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                    delay: 0.15,
                  }}
                >
                  <div className="relative max-w-[160px] rounded-2xl bg-card px-3 py-2 text-center text-sm font-medium text-foreground shadow-pop">
                    {idea.text}
                    <button
                      type="button"
                      onClick={() => removeIdea(idea.id)}
                      className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-soft transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Remove idea"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="mx-auto mt-6 max-w-md">
          <div className="rounded-full bg-gradient-mit p-1 shadow-pop">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addIdea();
                }
              }}
              placeholder="Add an idea, press Enter…"
              className="w-full rounded-full bg-card/95 px-5 py-3 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[color:var(--mit)]"
              autoFocus
            />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Saved automatically · click an idea to remove
          </p>
        </div>
      </main>
    </div>
  );
}

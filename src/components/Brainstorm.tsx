import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

// ---- Layout ----------------------------------------------------------------
// Estimate the rendered size of an idea card from its text.
const MAX_CARD_W = 220;
const CHAR_W = 8.2; // approx px per char at text-sm
const PAD_X = 28;
const LINE_H = 22;
const PAD_Y = 22;

function estimateCardSize(text: string): { w: number; h: number } {
  const oneLine = text.length * CHAR_W + PAD_X;
  if (oneLine <= MAX_CARD_W) {
    return { w: Math.max(60, oneLine), h: LINE_H + PAD_Y };
  }
  const lines = Math.ceil(oneLine / MAX_CARD_W);
  return { w: MAX_CARD_W, h: lines * LINE_H + PAD_Y };
}

type Placed = { x: number; y: number; w: number; h: number };

function rectsOverlap(a: Placed, b: Placed, margin = 18): boolean {
  return !(
    a.x + a.w / 2 + margin < b.x - b.w / 2 ||
    a.x - a.w / 2 - margin > b.x + b.w / 2 ||
    a.y + a.h / 2 + margin < b.y - b.h / 2 ||
    a.y - a.h / 2 - margin > b.y + b.h / 2
  );
}

const GOLDEN_DEG = 137.50776;

function layoutIdeas(
  ideas: Idea[],
  W: number,
  H: number,
  centerBox: Placed,
): Placed[] {
  const cx = W / 2;
  const cy = H / 2;
  const placed: Placed[] = [];
  // Smallest viable starting radius: just outside the center box.
  const baseR = Math.max(centerBox.w, centerBox.h) / 2 + 60;
  const maxR = Math.min(W, H) / 2 - 30;

  ideas.forEach((idea, i) => {
    const size = estimateCardSize(idea.text);
    let placedRect: Placed | null = null;
    // Try multiple angle offsets per radius, increasing radius until fit.
    const baseAngle = (i * GOLDEN_DEG - 90) * (Math.PI / 180);
    outer: for (let r = baseR; r <= maxR; r += 14) {
      // Try jittered angles around the golden-angle base.
      const jitterSteps = [0, 0.18, -0.18, 0.36, -0.36, 0.54, -0.54, 0.72, -0.72];
      for (const j of jitterSteps) {
        const a = baseAngle + j;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const rect: Placed = { x, y, w: size.w, h: size.h };
        // Bounds check (with margin).
        if (
          x - size.w / 2 < 16 ||
          x + size.w / 2 > W - 16 ||
          y - size.h / 2 < 16 ||
          y + size.h / 2 > H - 16
        ) {
          continue;
        }
        // Center collision.
        if (rectsOverlap(rect, centerBox, 24)) continue;
        // Other ideas collision.
        let bad = false;
        for (const p of placed) {
          if (rectsOverlap(rect, p, 18)) {
            bad = true;
            break;
          }
        }
        if (bad) continue;
        placedRect = rect;
        break outer;
      }
    }
    // Fallback: place at maxR even if it overlaps slightly.
    if (!placedRect) {
      const a = baseAngle;
      placedRect = {
        x: cx + Math.cos(a) * maxR,
        y: cy + Math.sin(a) * maxR,
        w: size.w,
        h: size.h,
      };
    }
    placed.push(placedRect);
  });
  return placed;
}

// ---- Component -------------------------------------------------------------

export function Brainstorm() {
  const [state, setState] = useState<BrainstormState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setState(loadBrainstorm());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveBrainstorm(state);
  }, [state, hydrated]);

  // Mouse spotlight tracking
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

  // Measure canvas size.
  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const el = canvasRef.current;
    const update = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Center "Options" oval — approximate size for layout.
  const centerBox: Placed = useMemo(
    () => ({ x: size.w / 2, y: size.h / 2, w: 280, h: 84 }),
    [size.w, size.h],
  );

  const placements = useMemo(() => {
    if (size.w === 0 || size.h === 0) return [] as Placed[];
    return layoutIdeas(state.ideas, size.w, size.h, centerBox);
  }, [state.ideas, size.w, size.h, centerBox]);

  const addIdea = () => {
    const text = draft.trim();
    if (!text) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setState((s) => ({ ...s, ideas: [...s.ideas, { id, text }] }));
    setLastAddedId(id);
    setDraft("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeIdea = (id: string) => {
    setState((s) => ({ ...s, ideas: s.ideas.filter((i) => i.id !== id) }));
  };

  const cx = size.w / 2;
  const cy = size.h / 2;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
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

      {/* Top bar — overlay */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur hover:bg-card/90"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to today
        </Link>
        <ThemePicker />
      </div>

      {/* Full-page canvas */}
      <div ref={canvasRef} className="relative h-full w-full">
        {/* SVG curved lines */}
        {size.w > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            width={size.w}
            height={size.h}
          >
            {state.ideas.map((idea, i) => {
              const p = placements[i];
              if (!p) return null;
              const dx = p.x - cx;
              const dy = p.y - cy;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              // Perpendicular offset for a gentle curve.
              const px = -dy / len;
              const py = dx / len;
              const curveAmt = Math.min(60, len * 0.18) * (i % 2 === 0 ? 1 : -1);
              const mx = (cx + p.x) / 2 + px * curveAmt;
              const my = (cy + p.y) / 2 + py * curveAmt;
              const isNew = idea.id === lastAddedId;
              return (
                <motion.path
                  key={idea.id}
                  d={`M ${cx} ${cy} Q ${mx} ${my} ${p.x} ${p.y}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeLinecap="round"
                  className="text-[color:var(--mit)] opacity-50"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{
                    duration: isNew ? 0.7 : 0.5,
                    delay: isNew ? 0.35 : 0,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                />
              );
            })}
          </svg>
        )}

        {/* Center editable title — bigger oval, lighter border */}
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="rounded-full bg-gradient-mit p-[2px] shadow-soft"
          >
            <input
              value={state.title}
              onChange={(e) =>
                setState((s) => ({ ...s, title: e.target.value }))
              }
              onFocus={(e) => e.currentTarget.select()}
              className="w-72 rounded-full bg-card/95 px-8 py-5 text-center font-display text-2xl font-semibold tracking-tight text-foreground outline-none focus:ring-2 focus:ring-[color:var(--mit)]"
              aria-label="Brainstorm title"
            />
          </motion.div>
        </div>

        {/* Idea nodes — absolutely placed by computed layout */}
        <AnimatePresence>
          {state.ideas.map((idea, i) => {
            const p = placements[i];
            if (!p) return null;
            const isNew = idea.id === lastAddedId;
            // Animate from input position (bottom center) up to its slot.
            const fromX = cx - p.x;
            const fromY = (size.h - 60) - p.y;
            return (
              <motion.div
                key={idea.id}
                className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{ left: p.x, top: p.y, maxWidth: MAX_CARD_W }}
                initial={
                  isNew
                    ? { x: fromX, y: fromY, scale: 0.7, opacity: 0 }
                    : { scale: 0, opacity: 0 }
                }
                animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={
                  isNew
                    ? { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
                    : { type: "spring", stiffness: 260, damping: 18 }
                }
              >
                <div className="relative rounded-2xl bg-card/90 px-3 py-2 text-center text-sm font-medium text-foreground shadow-soft backdrop-blur">
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

      {/* Input — bottom overlay */}
      <div className="absolute bottom-6 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-5">
        <div className="rounded-full bg-gradient-mit p-[2px] shadow-soft">
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
      </div>
    </div>
  );
}

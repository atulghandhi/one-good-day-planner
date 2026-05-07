import type React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowLeft, RotateCcw, X } from "lucide-react";
import { GlitterRain } from "./GlitterRain";
import { ThemePicker } from "./ThemePicker";
import { ResetDialog } from "./ResetDialog";

type ShapeKey = "pill" | "rounded" | "boxy" | "spiky" | "hex" | "blob";

type Idea = {
  id: string;
  text: string;
  // Custom position after drag (relative to canvas, in px). If undefined, auto layout.
  cx?: number;
  cy?: number;
  clusterId?: string;
};
type BrainstormState = { title: string; ideas: Idea[]; shape?: ShapeKey };

const STORAGE_KEY = "one-good-day:brainstorm:v2";
const EMPTY: BrainstormState = { title: "Options", ideas: [], shape: "pill" };

const SHAPES: { key: ShapeKey; label: string }[] = [
  { key: "pill", label: "Pill" },
  { key: "rounded", label: "Rounded" },
  { key: "boxy", label: "Boxy" },
  { key: "spiky", label: "Spiky" },
  { key: "hex", label: "Hexagon" },
  { key: "blob", label: "Blob" },
];

function shapeStyle(shape: ShapeKey): React.CSSProperties {
  switch (shape) {
    case "pill":
      return { borderRadius: 9999 };
    case "rounded":
      return { borderRadius: 24 };
    case "boxy":
      return { borderRadius: 4 };
    case "spiky":
      return {
        borderRadius: 0,
        clipPath:
          "polygon(0% 50%, 6% 25%, 18% 30%, 25% 8%, 40% 22%, 50% 0%, 60% 22%, 75% 8%, 82% 30%, 94% 25%, 100% 50%, 94% 75%, 82% 70%, 75% 92%, 60% 78%, 50% 100%, 40% 78%, 25% 92%, 18% 70%, 6% 75%)",
      };
    case "hex":
      return {
        borderRadius: 0,
        clipPath:
          "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
      };
    case "blob":
      return { borderRadius: "62% 38% 55% 45% / 50% 60% 40% 50%" };
  }
}

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
const MAX_CARD_W = 220;
const CHAR_W = 8.2;
const PAD_X = 28;
const LINE_H = 22;
const PAD_Y = 22;
const CLUSTER_DIST = 130; // px — drag-to-cluster threshold

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

function autoPlace(
  index: number,
  size: { w: number; h: number },
  W: number,
  H: number,
  centerBox: Placed,
  others: Placed[],
): Placed {
  const cx = W / 2;
  const cy = H / 2;
  const baseR = Math.max(centerBox.w, centerBox.h) / 2 + 60;
  const maxR = Math.min(W, H) / 2 - 30;
  const baseAngle = (index * GOLDEN_DEG - 90) * (Math.PI / 180);
  for (let r = baseR; r <= maxR; r += 14) {
    const jitterSteps = [0, 0.18, -0.18, 0.36, -0.36, 0.54, -0.54, 0.72, -0.72];
    for (const j of jitterSteps) {
      const a = baseAngle + j;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const rect: Placed = { x, y, w: size.w, h: size.h };
      if (
        x - size.w / 2 < 16 ||
        x + size.w / 2 > W - 16 ||
        y - size.h / 2 < 16 ||
        y + size.h / 2 > H - 16
      )
        continue;
      if (rectsOverlap(rect, centerBox, 24)) continue;
      let bad = false;
      for (const p of others) {
        if (rectsOverlap(rect, p, 18)) {
          bad = true;
          break;
        }
      }
      if (bad) continue;
      return rect;
    }
  }
  const a = baseAngle;
  return {
    x: cx + Math.cos(a) * maxR,
    y: cy + Math.sin(a) * maxR,
    w: size.w,
    h: size.h,
  };
}

function layoutIdeas(
  ideas: Idea[],
  W: number,
  H: number,
  centerBox: Placed,
): Placed[] {
  const placed: Placed[] = [];
  ideas.forEach((idea, i) => {
    const size = estimateCardSize(idea.text);
    if (idea.cx != null && idea.cy != null) {
      placed.push({ x: idea.cx, y: idea.cy, w: size.w, h: size.h });
    } else {
      placed.push(autoPlace(i, size, W, H, centerBox, placed));
    }
  });
  return placed;
}

// ---- Idea node (separated to use hooks per-card) --------------------------

type IdeaNodeProps = {
  idea: Idea;
  placement: Placed;
  isNew: boolean;
  isFocused: boolean;
  isDimmed: boolean;
  isEditing: boolean;
  parallaxX: number;
  parallaxY: number;
  fromX: number;
  fromY: number;
  driftSeed: number;
  onRemove: () => void;
  onPromote: () => void;
  onStartEdit: () => void;
  onCommitEdit: (text: string) => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
};

function IdeaNode({
  idea,
  placement,
  isNew,
  isFocused,
  isDimmed,
  isEditing,
  parallaxX,
  parallaxY,
  fromX,
  fromY,
  driftSeed,
  onRemove,
  onPromote,
  onStartEdit,
  onCommitEdit,
  onDrag,
  onDragEnd,
}: IdeaNodeProps) {
  const [draftText, setDraftText] = useState(idea.text);
  useEffect(() => setDraftText(idea.text), [idea.text]);

  // Per-idea drift offsets — small bobbing.
  const driftX = useMemo(() => 6 + (driftSeed % 5), [driftSeed]);
  const driftY = useMemo(() => 8 + ((driftSeed * 7) % 6), [driftSeed]);
  const driftDur = useMemo(() => 5 + (driftSeed % 4), [driftSeed]);
  const phase = useMemo(() => (driftSeed % 100) / 25, [driftSeed]);

  const commit = () => {
    const t = draftText.trim();
    if (t) onCommitEdit(t);
    else setDraftText(idea.text);
  };

  return (
    <div
      className="group absolute z-20"
      style={{
        left: placement.x,
        top: placement.y,
        transform: "translate(-50%, -50%)",
        maxWidth: MAX_CARD_W,
      }}
    >
      {/* Parallax layer — never receives drag */}
      <motion.div
        animate={{ x: parallaxX, y: parallaxY }}
        transition={{ type: "spring", stiffness: 60, damping: 18, mass: 0.6 }}
      >
      {/* Drag + entrance/focus layer */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onDrag={(_, info) => {
          onDrag(placement.x + info.offset.x, placement.y + info.offset.y);
        }}
        onDragEnd={(_, info) => {
          onDragEnd(placement.x + info.offset.x, placement.y + info.offset.y);
        }}
        initial={
          isNew
            ? { scale: 0.7, opacity: 0 }
            : { scale: 0, opacity: 0 }
        }
        animate={{
          scale: isFocused ? 1.18 : 1,
          opacity: isDimmed ? 0.25 : 1,
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={
          isNew
            ? { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
            : { type: "spring", stiffness: 220, damping: 22 }
        }
        whileHover={{ rotate: [-1.2, 1.2, 0], transition: { duration: 0.5 } }}
      >
      {/* Inner wrapper handles the slow bobbing drift independently */}
      <motion.div
        animate={{
          x: [0, driftX, -driftX * 0.7, driftX * 0.4, 0],
          y: [0, -driftY, driftY * 0.6, -driftY * 0.3, 0],
        }}
        transition={{
          duration: driftDur,
          repeat: Infinity,
          ease: "easeInOut",
          delay: phase,
        }}
      >
        <div
          onClick={(e) => {
            if (isEditing) return;
            e.stopPropagation();
            onPromote();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
          className="relative cursor-pointer rounded-2xl bg-card/90 px-3 py-2 text-center text-sm font-medium text-foreground shadow-soft backdrop-blur transition-shadow hover:shadow-lg"
          style={
            isFocused
              ? { boxShadow: "0 0 0 2px color-mix(in oklab, var(--mit) 60%, transparent), 0 12px 40px -8px color-mix(in oklab, var(--mit) 40%, transparent)" }
              : undefined
          }
        >
          {isEditing ? (
            <input
              autoFocus
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                } else if (e.key === "Escape") {
                  setDraftText(idea.text);
                  onCommitEdit(idea.text);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-center outline-none"
              style={{ minWidth: 60 }}
            />
          ) : (
            idea.text
          )}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-soft transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Remove idea"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </motion.div>
      </motion.div>
      </motion.div>
    </div>
  );
}

// ---- Component -------------------------------------------------------------

export function Brainstorm() {
  const [state, setState] = useState<BrainstormState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Live drag override: id -> {x,y} so curved lines follow during drag.
  const [dragLive, setDragLive] = useState<{ id: string; x: number; y: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [centerActive, setCenterActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const shape: ShapeKey = state.shape ?? "pill";

  // Mouse position for parallax (relative to canvas center).
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const mx = useSpring(mxRaw, { stiffness: 60, damping: 18, mass: 0.6 });
  const my = useSpring(myRaw, { stiffness: 60, damping: 18, mass: 0.6 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setState(loadBrainstorm());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveBrainstorm(state);
  }, [state, hydrated]);

  // Mouse spotlight + parallax tracking
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
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          // Normalise to -1..1 then scale to small px shift.
          const nx = (px - cx) / (rect.width / 2);
          const ny = (py - cy) / (rect.height / 2);
          mxRaw.set(-nx * 14);
          myRaw.set(-ny * 14);
        }
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mxRaw, myRaw]);

  // Subscribe to spring values and propagate to state for re-render.
  useEffect(() => {
    const u1 = mx.on("change", (v) => setParallax((p) => ({ ...p, x: v })));
    const u2 = my.on("change", (v) => setParallax((p) => ({ ...p, y: v })));
    return () => {
      u1();
      u2();
    };
  }, [mx, my]);

  // Measure canvas size.
  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const el = canvasRef.current;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const centerBox: Placed = useMemo(
    () => ({ x: size.w / 2, y: size.h / 2, w: 280, h: 84 }),
    [size.w, size.h],
  );

  const placements = useMemo(() => {
    if (size.w === 0 || size.h === 0) return [] as Placed[];
    const base = layoutIdeas(state.ideas, size.w, size.h, centerBox);
    return base;
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
    if (focusedId === id) setFocusedId(null);
    if (editingId === id) setEditingId(null);
  };

  const commitEdit = (id: string, text: string) => {
    setState((s) => ({
      ...s,
      ideas: s.ideas.map((i) => (i.id === id ? { ...i, text } : i)),
    }));
    setEditingId(null);
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    // Detect cluster: is this idea now near any other idea?
    const idx = state.ideas.findIndex((i) => i.id === id);
    let nearestId: string | null = null;
    let nearestDist = Infinity;
    placements.forEach((p, i) => {
      if (i === idx) return;
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearestDist) {
        nearestDist = d;
        nearestId = state.ideas[i].id;
      }
    });

    setState((s) => {
      const ideas = s.ideas.map((i) =>
        i.id === id ? { ...i, cx: x, cy: y } : i,
      );
      if (nearestId && nearestDist < CLUSTER_DIST) {
        const target = ideas.find((i) => i.id === nearestId);
        const cluster = target?.clusterId ?? `c-${Date.now().toString(36)}`;
        return {
          ...s,
          ideas: ideas.map((i) =>
            i.id === id || i.id === nearestId ? { ...i, clusterId: cluster } : i,
          ),
        };
      }
      // Dragged away from prior cluster → clear if no longer near anyone.
      return {
        ...s,
        ideas: ideas.map((i) => (i.id === id ? { ...i, clusterId: undefined } : i)),
      };
    });
    setDragLive(null);
  };

  // Compute cluster halos: bounding circle per clusterId.
  const clusterHalos = useMemo(() => {
    const groups: Record<string, { x: number; y: number; w: number; h: number }[]> = {};
    state.ideas.forEach((idea, i) => {
      if (!idea.clusterId) return;
      const p = placements[i];
      if (!p) return;
      (groups[idea.clusterId] ||= []).push(p);
    });
    return Object.entries(groups)
      .filter(([, arr]) => arr.length >= 2)
      .map(([id, arr]) => {
        const xs = arr.map((p) => p.x);
        const ys = arr.map((p) => p.y);
        const minX = Math.min(...arr.map((p) => p.x - p.w / 2));
        const maxX = Math.max(...arr.map((p) => p.x + p.w / 2));
        const minY = Math.min(...arr.map((p) => p.y - p.h / 2));
        const maxY = Math.max(...arr.map((p) => p.y + p.h / 2));
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const r = Math.max(maxX - minX, maxY - minY) / 2 + 32;
        return { id, cx, cy, r, count: xs.length + ys.length };
      });
  }, [state.ideas, placements]);

  const cx = size.w / 2;
  const cy = size.h / 2;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      onClick={() => {
        // Click on empty canvas clears focus
        if (focusedId) setFocusedId(null);
      }}
    >
      <GlitterRain />

      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[color:var(--could)] opacity-60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -right-24 h-80 w-80 rounded-full bg-[color:var(--mit)] opacity-50 blur-3xl"
      />

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur hover:bg-card/90"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to today
        </Link>
        <div className="flex items-center gap-2">
          <ThemePicker />
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            whileHover={{ rotate: -90, scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground shadow-pop"
            aria-label="Reset brainstorm"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      {/* Full-page canvas */}
      <div ref={canvasRef} className="relative h-full w-full">
        {/* SVG: cluster halos + curved lines + animated shimmer */}
        {size.w > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            width={size.w}
            height={size.h}
          >
            <defs>
              <linearGradient id="lineShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Cluster halos */}
            {clusterHalos.map((h) => (
              <motion.circle
                key={h.id}
                cx={h.cx}
                cy={h.cy}
                r={h.r}
                fill="currentColor"
                className="text-[color:var(--should)]"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 0.12, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: `${h.cx}px ${h.cy}px`, filter: "blur(14px)" }}
              />
            ))}

            {state.ideas.map((idea, i) => {
              const base = placements[i];
              if (!base) return null;
              const p = dragLive && dragLive.id === idea.id
                ? { ...base, x: dragLive.x, y: dragLive.y }
                : base;
              // Apply parallax to endpoint so line tracks the visually shifted card.
              const px2 = p.x + parallax.x;
              const py2 = p.y + parallax.y;
              const dx = px2 - cx;
              const dy = py2 - cy;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const perpX = -dy / len;
              const perpY = dx / len;
              const curveAmt = Math.min(60, len * 0.18) * (i % 2 === 0 ? 1 : -1);
              const mxp = (cx + px2) / 2 + perpX * curveAmt;
              const myp = (cy + py2) / 2 + perpY * curveAmt;
              const isNew = idea.id === lastAddedId;
              const d = `M ${cx} ${cy} Q ${mxp} ${myp} ${px2} ${py2}`;
              return (
                <g key={idea.id}>
                  {/* Base line */}
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1}
                    strokeLinecap="round"
                    className="text-[color:var(--mit)] opacity-50"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{
                      duration: isNew ? 0.7 : 0.4,
                      delay: isNew ? 0.35 : 0,
                      ease: [0.32, 0.72, 0, 1],
                    }}
                  />
                  {/* Shimmer overlay flowing from center outward */}
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="text-[color:var(--mit)]"
                    style={{ pathLength: 0.18 }}
                    initial={{ pathOffset: 0, opacity: 0 }}
                    animate={{ pathOffset: [0, 1], opacity: [0, 0.7, 0] }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: (i % 5) * 0.4,
                    }}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Center editable title — breathing gradient pulse */}
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.035, 1], opacity: 1 }}
            transition={{
              scale: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.4 },
            }}
            className="relative rounded-full bg-gradient-mit p-[2px] shadow-soft"
            style={{
              filter: "drop-shadow(0 0 24px color-mix(in oklab, var(--mit) 35%, transparent))",
            }}
          >
            {/* Soft outer glow that pulses */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full bg-gradient-mit"
              animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.15, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: "blur(20px)", zIndex: -1 }}
            />
            <input
              value={state.title}
              onChange={(e) =>
                setState((s) => ({ ...s, title: e.target.value }))
              }
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.stopPropagation()}
              className="w-72 rounded-full bg-card/95 px-8 py-5 text-center font-display text-2xl font-semibold tracking-tight text-foreground outline-none focus:ring-2 focus:ring-[color:var(--mit)]"
              aria-label="Brainstorm title"
            />
          </motion.div>
        </div>

        {/* Idea nodes */}
        <AnimatePresence>
          {state.ideas.map((idea, i) => {
            const p = placements[i];
            if (!p) return null;
            const isNew = idea.id === lastAddedId;
            const fromX = cx - p.x;
            const fromY = (size.h - 60) - p.y;
            const seed =
              idea.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) || i + 1;
            return (
              <IdeaNode
                key={idea.id}
                idea={idea}
                placement={p}
                isNew={isNew}
                isFocused={focusedId === idea.id}
                isDimmed={focusedId !== null && focusedId !== idea.id}
                isEditing={editingId === idea.id}
                parallaxX={parallax.x}
                parallaxY={parallax.y}
                fromX={fromX}
                fromY={fromY}
                driftSeed={seed}
                onRemove={() => removeIdea(idea.id)}
                onPromote={() =>
                  setFocusedId((f) => (f === idea.id ? null : idea.id))
                }
                onStartEdit={() => setEditingId(idea.id)}
                onCommitEdit={(t) => commitEdit(idea.id, t)}
                onDrag={(x, y) => setDragLive({ id: idea.id, x, y })}
                onDragEnd={(x, y) => handleDragEnd(idea.id, x, y)}
              />
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
            onClick={(e) => e.stopPropagation()}
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

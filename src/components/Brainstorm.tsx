import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, LocateFixed, Minus, Plus, RotateCcw, X } from "lucide-react";
import { ResetDialog } from "./ResetDialog";
import { ThemePicker } from "./ThemePicker";
import { cn } from "@/lib/utils";

type ShapeKey = "pill" | "boxy" | "blob";
type LegacyShapeKey = ShapeKey | "rounded" | "hex";

type Idea = {
  id: string;
  text: string;
  cx?: number;
  cy?: number;
  parentId?: string;
};

type BrainstormState = {
  version: 3;
  title: string;
  ideas: Idea[];
  shape: ShapeKey;
};

const STORAGE_KEY = "one-good-day:brainstorm:v2";
const EMPTY: BrainstormState = {
  version: 3,
  title: "Options",
  ideas: [],
  shape: "pill",
};

const SHAPES: { key: ShapeKey; label: string }[] = [
  { key: "pill", label: "Soft" },
  { key: "boxy", label: "Square" },
  { key: "blob", label: "Sketch" },
];

const VALID_SHAPES = new Set<ShapeKey>(SHAPES.map((shape) => shape.key));

const WORLD_SIZE = 6200;
const WORLD_CENTER = WORLD_SIZE / 2;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.25;
const MAX_CARD_W = 230;
const MAX_TITLE_CHARS = 64;
const TITLE_MIN_HEIGHT = 72;
const TITLE_MAX_HEIGHT = 106;
const CHAR_W = 8.2;
const PAD_X = 30;
const LINE_H = 22;
const PAD_Y = 24;
const CENTER_BOX: Placed = { x: 0, y: 0, w: 360, h: 124 };
const GOLDEN_DEG = 137.50776;
const OUTWARD_CHILD_SLOTS = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5];
const PAGE_THEME_VIEWPORT_STROKE: Record<string, string> = {
  sakura: "#7c3aed",
  blossom: "#9a4f19",
  meadow: "#9a6a00",
  nebula: "currentColor",
  forest: "currentColor",
  starry: "currentColor",
};

type SketchMarker = {
  marker: string;
  markerDark: string;
  markerGlow: string;
  line: string;
};

type SketchPalette = {
  paper: string;
  paperAccent: string;
  card: string;
  ink: string;
  doodle: string;
  marker: string;
  markerDark: string;
  markerGlow: string;
  ringHighlight: string;
  line: string;
  shadow: string;
  placeholder: string;
  textShadow: string;
  childMarkers: SketchMarker[];
};

const SKETCH_PALETTES: Record<string, SketchPalette> = {
  sakura: {
    paper: "#fff7f6",
    paperAccent: "rgba(204, 115, 159, 0.12)",
    card: "#fffdf9",
    ink: "#25151f",
    doodle: "#2f1828",
    marker: "#e8a4c8",
    markerDark: "#b96c9d",
    markerGlow: "rgba(232, 164, 200, 0.46)",
    ringHighlight: "rgba(255, 255, 255, 0.72)",
    line: "#2b1d25",
    shadow: "rgba(37, 21, 31, 0.14)",
    placeholder: "rgba(37, 21, 31, 0.48)",
    textShadow: "rgba(37, 21, 31, 0.24)",
    childMarkers: [
      {
        marker: "#e8a4c8",
        markerDark: "#b96c9d",
        markerGlow: "rgba(232, 164, 200, 0.46)",
        line: "#b96c9d",
      },
      {
        marker: "#c9b0ff",
        markerDark: "#7e63d8",
        markerGlow: "rgba(201, 176, 255, 0.38)",
        line: "#7e63d8",
      },
      {
        marker: "#f3b08f",
        markerDark: "#bb6a43",
        markerGlow: "rgba(243, 176, 143, 0.38)",
        line: "#bb6a43",
      },
      {
        marker: "#94d8b4",
        markerDark: "#529c78",
        markerGlow: "rgba(148, 216, 180, 0.38)",
        line: "#529c78",
      },
      {
        marker: "#f1d06c",
        markerDark: "#a77919",
        markerGlow: "rgba(241, 208, 108, 0.38)",
        line: "#a77919",
      },
    ],
  },
  blossom: {
    paper: "#fff8ef",
    paperAccent: "rgba(148, 216, 180, 0.11)",
    card: "#fffaf4",
    ink: "#171311",
    doodle: "#171311",
    marker: "#94d8b4",
    markerDark: "#62b98f",
    markerGlow: "rgba(148, 216, 180, 0.58)",
    ringHighlight: "rgba(255, 255, 255, 0.72)",
    line: "#24201c",
    shadow: "rgba(23, 19, 17, 0.14)",
    placeholder: "rgba(23, 19, 17, 0.45)",
    textShadow: "rgba(23, 19, 17, 0.22)",
    childMarkers: [
      {
        marker: "#94d8b4",
        markerDark: "#62b98f",
        markerGlow: "rgba(148, 216, 180, 0.58)",
        line: "#4f9f79",
      },
      {
        marker: "#ffb0a2",
        markerDark: "#cf6d58",
        markerGlow: "rgba(255, 176, 162, 0.42)",
        line: "#bf5f4d",
      },
      {
        marker: "#c6b7ff",
        markerDark: "#7f69dd",
        markerGlow: "rgba(198, 183, 255, 0.38)",
        line: "#715dc9",
      },
      {
        marker: "#f3d76c",
        markerDark: "#b28b19",
        markerGlow: "rgba(243, 215, 108, 0.38)",
        line: "#9c7914",
      },
      {
        marker: "#91d3ef",
        markerDark: "#3b8ab4",
        markerGlow: "rgba(145, 211, 239, 0.36)",
        line: "#33799f",
      },
    ],
  },
  meadow: {
    paper: "#fffbe8",
    paperAccent: "rgba(214, 166, 35, 0.13)",
    card: "#fffdf1",
    ink: "#242113",
    doodle: "#292310",
    marker: "#edcf69",
    markerDark: "#ad7f17",
    markerGlow: "rgba(237, 207, 105, 0.5)",
    ringHighlight: "rgba(255, 255, 255, 0.7)",
    line: "#302712",
    shadow: "rgba(48, 39, 18, 0.15)",
    placeholder: "rgba(36, 33, 19, 0.48)",
    textShadow: "rgba(48, 39, 18, 0.22)",
    childMarkers: [
      {
        marker: "#edcf69",
        markerDark: "#ad7f17",
        markerGlow: "rgba(237, 207, 105, 0.5)",
        line: "#9c7414",
      },
      {
        marker: "#9fd2ff",
        markerDark: "#457fb2",
        markerGlow: "rgba(159, 210, 255, 0.38)",
        line: "#3a719f",
      },
      {
        marker: "#f5a881",
        markerDark: "#ba653c",
        markerGlow: "rgba(245, 168, 129, 0.36)",
        line: "#a85a34",
      },
      {
        marker: "#aedf91",
        markerDark: "#679b42",
        markerGlow: "rgba(174, 223, 145, 0.38)",
        line: "#5c893b",
      },
      {
        marker: "#d7b0ff",
        markerDark: "#8b61c4",
        markerGlow: "rgba(215, 176, 255, 0.34)",
        line: "#7752ad",
      },
    ],
  },
  nebula: {
    paper: "#130d20",
    paperAccent: "rgba(245, 93, 199, 0.14)",
    card: "#21172f",
    ink: "#fff2ff",
    doodle: "#f5ddff",
    marker: "#ff6fcf",
    markerDark: "#65d6ff",
    markerGlow: "rgba(255, 111, 207, 0.36)",
    ringHighlight: "rgba(255, 255, 255, 0.28)",
    line: "#fff2ff",
    shadow: "rgba(0, 0, 0, 0.34)",
    placeholder: "rgba(255, 242, 255, 0.5)",
    textShadow: "rgba(0, 0, 0, 0.45)",
    childMarkers: [
      {
        marker: "#ff6fcf",
        markerDark: "#65d6ff",
        markerGlow: "rgba(255, 111, 207, 0.36)",
        line: "#ff95df",
      },
      {
        marker: "#65d6ff",
        markerDark: "#9c8cff",
        markerGlow: "rgba(101, 214, 255, 0.32)",
        line: "#9ee5ff",
      },
      {
        marker: "#ffe26e",
        markerDark: "#ff9bd7",
        markerGlow: "rgba(255, 226, 110, 0.28)",
        line: "#ffe88d",
      },
      {
        marker: "#b6ff8a",
        markerDark: "#65d6ff",
        markerGlow: "rgba(182, 255, 138, 0.26)",
        line: "#cbffa9",
      },
      {
        marker: "#c7a8ff",
        markerDark: "#ff6fcf",
        markerGlow: "rgba(199, 168, 255, 0.3)",
        line: "#d6bfff",
      },
    ],
  },
  forest: {
    paper: "#101912",
    paperAccent: "rgba(150, 205, 124, 0.12)",
    card: "#19251b",
    ink: "#f5efd7",
    doodle: "#efe7c9",
    marker: "#93cf82",
    markerDark: "#d0b565",
    markerGlow: "rgba(147, 207, 130, 0.32)",
    ringHighlight: "rgba(255, 245, 211, 0.24)",
    line: "#f5efd7",
    shadow: "rgba(0, 0, 0, 0.32)",
    placeholder: "rgba(245, 239, 215, 0.48)",
    textShadow: "rgba(0, 0, 0, 0.44)",
    childMarkers: [
      {
        marker: "#93cf82",
        markerDark: "#d0b565",
        markerGlow: "rgba(147, 207, 130, 0.32)",
        line: "#b8e4a6",
      },
      {
        marker: "#d0b565",
        markerDark: "#93cf82",
        markerGlow: "rgba(208, 181, 101, 0.3)",
        line: "#ead38a",
      },
      {
        marker: "#79c7a2",
        markerDark: "#c5dc85",
        markerGlow: "rgba(121, 199, 162, 0.28)",
        line: "#9fe2c0",
      },
      {
        marker: "#c5dc85",
        markerDark: "#8ebc5e",
        markerGlow: "rgba(197, 220, 133, 0.3)",
        line: "#d9ee9f",
      },
      {
        marker: "#e1a36c",
        markerDark: "#a8753f",
        markerGlow: "rgba(225, 163, 108, 0.28)",
        line: "#f0bc85",
      },
    ],
  },
  starry: {
    paper: "#0b1024",
    paperAccent: "rgba(126, 201, 255, 0.13)",
    card: "#151d35",
    ink: "#f0f7ff",
    doodle: "#e7f1ff",
    marker: "#7ec9ff",
    markerDark: "#b8a0ff",
    markerGlow: "rgba(126, 201, 255, 0.34)",
    ringHighlight: "rgba(255, 255, 255, 0.25)",
    line: "#f0f7ff",
    shadow: "rgba(0, 0, 0, 0.36)",
    placeholder: "rgba(240, 247, 255, 0.5)",
    textShadow: "rgba(0, 0, 0, 0.46)",
    childMarkers: [
      {
        marker: "#7ec9ff",
        markerDark: "#b8a0ff",
        markerGlow: "rgba(126, 201, 255, 0.34)",
        line: "#a5dcff",
      },
      {
        marker: "#b8a0ff",
        markerDark: "#7ec9ff",
        markerGlow: "rgba(184, 160, 255, 0.3)",
        line: "#c8b6ff",
      },
      {
        marker: "#ffe88d",
        markerDark: "#7ec9ff",
        markerGlow: "rgba(255, 232, 141, 0.25)",
        line: "#fff0a8",
      },
      {
        marker: "#8ef4d0",
        markerDark: "#7ec9ff",
        markerGlow: "rgba(142, 244, 208, 0.25)",
        line: "#a9ffe1",
      },
      {
        marker: "#ff9dd7",
        markerDark: "#b8a0ff",
        markerGlow: "rgba(255, 157, 215, 0.26)",
        line: "#ffbae3",
      },
    ],
  },
};

function sketchMarkerForDepth(palette: SketchPalette, depth: number): SketchMarker {
  return palette.childMarkers[depthLevel(depth) % palette.childMarkers.length] ?? palette;
}

function safeSvgId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

type Placed = { x: number; y: number; w: number; h: number };

type ShapeTheme = {
  fontFamily: string;
  cardClassName: string;
  controlClassName: string;
  lineMode: "curve" | "orthogonal" | "sketch";
};

const SHAPE_THEMES: Record<ShapeKey, ShapeTheme> = {
  pill: {
    fontFamily:
      '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    cardClassName: "bg-card/90 shadow-soft backdrop-blur",
    controlClassName: "bg-card/70 shadow-soft backdrop-blur",
    lineMode: "curve",
  },
  boxy: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    cardClassName:
      "border-2 border-foreground/25 bg-card/95 shadow-[6px_6px_0_color-mix(in_oklab,var(--mit)_26%,transparent)]",
    controlClassName:
      "border-2 border-foreground/25 bg-card/90 shadow-[4px_4px_0_color-mix(in_oklab,var(--mit)_24%,transparent)]",
    lineMode: "orthogonal",
  },
  blob: {
    fontFamily:
      '"Marker Felt", "Chalkboard SE", "Comic Sans MS", "Bradley Hand", cursive, ui-sans-serif, system-ui, sans-serif',
    cardClassName: "shadow-[3px_4px_0_rgba(23,19,17,0.12)]",
    controlClassName: "border-2 shadow-[3px_4px_0_rgba(23,19,17,0.16)]",
    lineMode: "sketch",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeShape(shape: unknown): ShapeKey {
  if (shape === "rounded" || shape === "spiky") return "pill";
  if (shape === "hex") return "blob";
  return typeof shape === "string" && VALID_SHAPES.has(shape as ShapeKey)
    ? (shape as ShapeKey)
    : "pill";
}

function normalizeTitleValue(value: string) {
  return value.split("\n").slice(0, 2).join("\n").slice(0, MAX_TITLE_CHARS);
}

function shapeStyle(shape: ShapeKey): React.CSSProperties {
  switch (shape) {
    case "pill":
      return { borderRadius: 9999 };
    case "boxy":
      return { borderRadius: 3 };
    case "blob":
      return {
        borderRadius: "58% 42% 54% 46% / 47% 57% 43% 53%",
      };
  }
}

function loadBrainstorm(): BrainstormState {
  if (typeof window === "undefined") return EMPTY;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;

    const parsed = JSON.parse(raw) as Partial<
      Omit<BrainstormState, "shape"> & {
        shape?: LegacyShapeKey;
        version?: number;
        ideas?: Partial<Idea>[];
      }
    >;
    const legacyCoords = parsed.version !== 3;
    const viewportOffsetX = window.innerWidth / 2;
    const viewportOffsetY = window.innerHeight / 2;
    const seen = new Set<string>();
    const ideas = Array.isArray(parsed.ideas)
      ? parsed.ideas.flatMap((idea) => {
          if (typeof idea.id !== "string" || typeof idea.text !== "string") {
            return [];
          }
          const id = idea.id;
          if (seen.has(id)) return [];
          seen.add(id);
          const cx = isFiniteNumber(idea.cx)
            ? legacyCoords
              ? idea.cx - viewportOffsetX
              : idea.cx
            : undefined;
          const cy = isFiniteNumber(idea.cy)
            ? legacyCoords
              ? idea.cy - viewportOffsetY
              : idea.cy
            : undefined;
          return [
            {
              id,
              text: idea.text,
              cx,
              cy,
              parentId:
                typeof idea.parentId === "string" && idea.parentId !== id
                  ? idea.parentId
                  : undefined,
            },
          ];
        })
      : [];

    const ids = new Set(ideas.map((idea) => idea.id));

    return {
      version: 3,
      title: typeof parsed.title === "string" ? normalizeTitleValue(parsed.title) : EMPTY.title,
      ideas: ideas.map((idea) =>
        idea.parentId && !ids.has(idea.parentId) ? { ...idea, parentId: undefined } : idea,
      ),
      shape: normalizeShape(parsed.shape),
    };
  } catch {
    return EMPTY;
  }
}

function saveBrainstorm(state: BrainstormState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: 3 }));
  } catch {
    /* ignore */
  }
}

function depthLevel(depth: number) {
  return clamp(depth, 0, 4);
}

function ideaFontSize(depth: number) {
  return Math.max(12, 14 - depthLevel(depth) * 1.05);
}

function computeDepthMap(ideas: Idea[]) {
  const byId = new Map(ideas.map((idea) => [idea.id, idea]));
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  const depthOf = (idea: Idea): number => {
    const cached = memo.get(idea.id);
    if (cached != null) return cached;
    if (!idea.parentId || !byId.has(idea.parentId) || visiting.has(idea.id)) {
      memo.set(idea.id, 0);
      return 0;
    }

    visiting.add(idea.id);
    const depth = depthOf(byId.get(idea.parentId)!) + 1;
    visiting.delete(idea.id);
    memo.set(idea.id, depth);
    return depth;
  };

  ideas.forEach(depthOf);
  return memo;
}

function estimateCardSize(text: string, shape: ShapeKey, depth = 0): { w: number; h: number } {
  const level = depthLevel(depth);
  const fontScale = ideaFontSize(level) / 14;
  const charW = shape === "boxy" ? 8.9 : shape === "blob" ? 8.8 : CHAR_W;
  const maxW = Math.max(170, MAX_CARD_W - level * 14);
  const padX = Math.max(20, PAD_X - level * 3);
  const padY = Math.max(16, PAD_Y - level * 2);
  const lineH = Math.max(17, LINE_H - level * 1.2);
  const oneLine = text.length * charW * fontScale + padX;
  if (oneLine <= maxW) {
    return { w: Math.max(74, oneLine), h: lineH + padY };
  }
  const lines = Math.ceil(oneLine / maxW);
  return { w: maxW, h: lines * lineH + padY };
}

function rectsOverlap(a: Placed, b: Placed, margin = 24): boolean {
  return !(
    a.x + a.w / 2 + margin < b.x - b.w / 2 ||
    a.x - a.w / 2 - margin > b.x + b.w / 2 ||
    a.y + a.h / 2 + margin < b.y - b.h / 2 ||
    a.y - a.h / 2 - margin > b.y + b.h / 2
  );
}

function findOpenSpot(
  parent: Placed,
  size: { w: number; h: number },
  occupied: Placed[],
  siblingIndex: number,
  shape: ShapeKey,
  preferredAngle?: number,
): Placed {
  if (shape === "boxy") {
    const grid = Math.max(parent.w, parent.h) / 2 + Math.max(size.w, size.h) / 2 + 96;
    const slots = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ] as const;

    for (let ring = 1; ring <= 8; ring++) {
      for (let i = 0; i < slots.length; i++) {
        const [sx, sy] = slots[(siblingIndex + i) % slots.length];
        const rect = {
          x: parent.x + sx * grid * ring,
          y: parent.y + sy * grid * ring,
          w: size.w,
          h: size.h,
        };
        if (!occupied.some((placed) => rectsOverlap(rect, placed, 28))) {
          return rect;
        }
      }
    }
  }

  const baseR = Math.max(parent.w, parent.h) / 2 + Math.max(size.w, size.h) / 2 + 118;
  if (shape === "blob" && preferredAngle != null) {
    for (let ring = 0; ring <= 12; ring++) {
      const r = baseR + 36 + ring * 46;
      for (let i = 0; i < OUTWARD_CHILD_SLOTS.length; i++) {
        const slot = OUTWARD_CHILD_SLOTS[(siblingIndex + i) % OUTWARD_CHILD_SLOTS.length];
        const angle = preferredAngle + slot * 0.38 + ring * 0.035;
        const rect = {
          x: parent.x + Math.cos(angle) * r,
          y: parent.y + Math.sin(angle) * r,
          w: size.w,
          h: size.h,
        };
        if (!occupied.some((placed) => rectsOverlap(rect, placed, 28))) {
          return rect;
        }
      }
    }

    return {
      x: parent.x + Math.cos(preferredAngle) * (baseR + 720),
      y: parent.y + Math.sin(preferredAngle) * (baseR + 720),
      w: size.w,
      h: size.h,
    };
  }

  const startAngle = (siblingIndex * GOLDEN_DEG - 92) * (Math.PI / 180);
  const angleJitter = [0, 0.22, -0.22, 0.45, -0.45, 0.7, -0.7, 0.95, -0.95];

  for (let ring = 0; ring <= 14; ring++) {
    const r = baseR + ring * 42;
    for (const jitter of angleJitter) {
      const angle = startAngle + jitter + ring * 0.11;
      const rect = {
        x: parent.x + Math.cos(angle) * r,
        y: parent.y + Math.sin(angle) * r,
        w: size.w,
        h: size.h,
      };
      if (!occupied.some((placed) => rectsOverlap(rect, placed, 24))) {
        return rect;
      }
    }
  }

  return {
    x: parent.x + Math.cos(startAngle) * (baseR + 680),
    y: parent.y + Math.sin(startAngle) * (baseR + 680),
    w: size.w,
    h: size.h,
  };
}

function layoutIdeas(ideas: Idea[], shape: ShapeKey): Placed[] {
  const byId = new Map(ideas.map((idea, index) => [idea.id, { idea, index }]));
  const depthById = computeDepthMap(ideas);
  const placed = new Map<string, Placed>();
  const occupied: Placed[] = [CENTER_BOX];
  const siblingCounts = new Map<string, number>();
  const visiting = new Set<string>();

  const placeIdea = (idea: Idea): Placed => {
    const cached = placed.get(idea.id);
    if (cached) return cached;

    if (visiting.has(idea.id)) {
      const fallback = { ...CENTER_BOX };
      placed.set(idea.id, fallback);
      return fallback;
    }

    visiting.add(idea.id);
    const size = estimateCardSize(idea.text, shape, depthById.get(idea.id) ?? 0);
    let rect: Placed;

    if (isFiniteNumber(idea.cx) && isFiniteNumber(idea.cy)) {
      rect = { x: idea.cx, y: idea.cy, ...size };
    } else {
      const parentInfo = idea.parentId ? byId.get(idea.parentId) : undefined;
      const parent = parentInfo ? placeIdea(parentInfo.idea) : CENTER_BOX;
      const grandparentInfo = parentInfo?.idea.parentId
        ? byId.get(parentInfo.idea.parentId)
        : undefined;
      const parentOrigin = grandparentInfo ? placeIdea(grandparentInfo.idea) : CENTER_BOX;
      const preferredAngle =
        shape === "blob" && parentInfo
          ? Math.atan2(parent.y - parentOrigin.y, parent.x - parentOrigin.x)
          : undefined;
      const parentKey = idea.parentId ?? "center";
      const siblingIndex = siblingCounts.get(parentKey) ?? 0;
      siblingCounts.set(parentKey, siblingIndex + 1);
      rect = findOpenSpot(parent, size, occupied, siblingIndex, shape, preferredAngle);
    }

    visiting.delete(idea.id);
    placed.set(idea.id, rect);
    occupied.push(rect);
    return rect;
  };

  ideas.forEach(placeIdea);
  return ideas.map((idea) => placed.get(idea.id) ?? CENTER_BOX);
}

function toCanvasPoint(point: { x: number; y: number }) {
  return {
    x: WORLD_CENTER + point.x,
    y: WORLD_CENTER + point.y,
  };
}

function toScreenPoint(point: { x: number; y: number }, view: CanvasView) {
  const canvasPoint = toCanvasPoint(point);
  return {
    x: view.x + canvasPoint.x * view.zoom,
    y: view.y + canvasPoint.y * view.zoom,
  };
}

function connectorPathFromPoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
  mode: ShapeTheme["lineMode"],
  index: number,
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  if (mode === "orthogonal") {
    const bias = (index % 3) * 18 - 18;
    if (Math.abs(dx) > Math.abs(dy)) {
      const elbowX = start.x + dx * 0.52 + bias;
      return `M ${start.x} ${start.y} H ${elbowX} V ${end.y} H ${end.x}`;
    }
    const elbowY = start.y + dy * 0.52 + bias;
    return `M ${start.x} ${start.y} V ${elbowY} H ${end.x} V ${end.y}`;
  }

  if (mode === "sketch") {
    const curveAmt = Math.min(74, len * 0.22) * (index % 2 === 0 ? 1 : -1);
    const wobble = 12 + (index % 5) * 3.5;
    const c1x = start.x + dx * 0.28 + perpX * (curveAmt + wobble);
    const c1y = start.y + dy * 0.28 + perpY * (curveAmt + wobble * 0.6);
    const c2x = start.x + dx * 0.74 - perpX * (wobble * 0.85);
    const c2y = start.y + dy * 0.74 - perpY * wobble;
    return `M ${start.x} ${start.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${end.x} ${end.y}`;
  }

  const curveAmt = Math.min(70, len * 0.18) * (index % 2 === 0 ? 1 : -1);
  const mx = (start.x + end.x) / 2 + perpX * curveAmt;
  const my = (start.y + end.y) / 2 + perpY * curveAmt;
  return `M ${start.x} ${start.y} Q ${mx} ${my} ${end.x} ${end.y}`;
}

function controlStyle(
  shape: ShapeKey,
  theme: ShapeTheme,
  sketchPalette?: SketchPalette,
): React.CSSProperties {
  const base = {
    ...shapeStyle(shape),
    fontFamily: theme.fontFamily,
  };

  if (shape !== "blob" || !sketchPalette) return base;

  return {
    ...base,
    backgroundColor: sketchPalette.card,
    borderColor: sketchPalette.ink,
    boxShadow: `3px 4px 0 ${sketchPalette.shadow}`,
    color: sketchPalette.ink,
  };
}

function SketchDoodles({ palette }: { palette: SketchPalette }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ color: palette.doodle }}
    >
      <svg className="absolute -left-4 top-4 h-36 w-36" viewBox="0 0 144 144" fill="none">
        {Array.from({ length: 18 }).map((_, index) => (
          <path
            key={index}
            d={`M ${12 + (index % 5) * 21} ${10 + Math.floor(index / 5) * 24} q ${5 + (index % 3)} ${-6 + (index % 4) * 3} ${11 + (index % 2) * 3} 1`}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.9"
          />
        ))}
      </svg>
      <svg className="absolute right-5 top-4 h-24 w-52" viewBox="0 0 208 96" fill="none">
        <path
          d="M8 54 C22 8 36 88 50 24 C64 -6 78 82 92 18 C108 -10 120 82 134 18 C148 -8 162 82 176 18 C190 -4 198 52 204 38"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg className="absolute bottom-0 -left-2 h-28 w-72" viewBox="0 0 288 112" fill="none">
        <path
          d="M2 72 C24 14 54 118 76 54 C98 -8 118 112 143 62 C168 12 180 110 205 72 C230 34 252 102 286 58"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <svg className="absolute bottom-12 right-8 h-48 w-48" viewBox="0 0 192 192" fill="none">
        <path
          d="M38 44 C30 26 58 18 68 40 C76 18 104 28 94 50 C84 72 58 82 38 44Z"
          fill="currentColor"
        />
        <path
          d="M116 70 C110 56 132 50 140 66 C146 50 168 58 160 76 C152 94 132 100 116 70Z"
          fill="currentColor"
        />
        {Array.from({ length: 16 }).map((_, index) => (
          <path
            key={index}
            d={`M ${28 + (index % 4) * 38} ${112 + Math.floor(index / 4) * 18} q 7 -9 14 0`}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <svg className="absolute left-6 top-1/3 h-28 w-28" viewBox="0 0 112 112" fill="none">
        <path
          d="M56 6 C61 38 73 50 106 56 C73 62 61 74 56 106 C51 74 39 62 6 56 C39 50 51 38 56 6Z"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M86 10 V42 M70 26 H102"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

type IdeaNodeProps = {
  idea: Idea;
  placement: Placed;
  depth: number;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  sketchMarker: SketchMarker;
  isNew: boolean;
  isFocused: boolean;
  isEditing: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommitEdit: (text: string) => void;
  onStartDrag: (event: React.PointerEvent<HTMLElement>) => void;
};

function IdeaNode({
  idea,
  placement,
  depth,
  shape,
  theme,
  sketchPalette,
  sketchMarker,
  isNew,
  isFocused,
  isEditing,
  isDragging,
  onRemove,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onStartDrag,
}: IdeaNodeProps) {
  const [draftText, setDraftText] = useState(idea.text);

  useEffect(() => setDraftText(idea.text), [idea.text]);

  const commit = () => {
    const text = draftText.trim();
    if (text) onCommitEdit(text);
    else setDraftText(idea.text);
  };

  const canvasPoint = toCanvasPoint(placement);
  const isSketch = shape === "blob";
  const level = depthLevel(depth);
  const fontSize = isSketch ? Math.max(12.5, 15.5 - level * 1.15) : ideaFontSize(level);
  const fontWeight = isSketch ? Math.max(600, 800 - level * 55) : Math.max(520, 650 - level * 45);
  const focusScale = Math.max(1.025, 1.08 - level * 0.012);
  const focusRing = Math.max(1, 2 - level * 0.22);
  const focusedShadow = isSketch
    ? `0 0 0 ${Math.max(2, focusRing)}px ${sketchPalette.ink}, 0 0 0 ${Math.max(
        8,
        12 - level,
      )}px ${sketchMarker.markerGlow}, 5px 7px 0 ${sketchPalette.shadow}`
    : `0 0 0 ${focusRing}px color-mix(in oklab, var(--mit) ${Math.max(
        38,
        62 - level * 6,
      )}%, transparent), 0 ${Math.max(8, 14 - level)}px ${Math.max(
        22,
        42 - level * 5,
      )}px -12px color-mix(in oklab, var(--mit) ${Math.max(20, 44 - level * 6)}%, transparent)`;
  const restingShadow = isSketch
    ? `3px 4px 0 ${sketchPalette.shadow}`
    : level === 0
      ? undefined
      : `0 ${Math.max(5, 8 - level)}px ${Math.max(
          12,
          20 - level * 2,
        )}px -16px color-mix(in oklab, var(--foreground) 22%, transparent)`;
  const nestedBorder = isSketch
    ? "0 solid transparent"
    : level > 0
      ? `${shape === "blob" ? Math.max(1.25, 2.2 - level * 0.25) : 1}px solid color-mix(in oklab, var(--foreground) ${Math.max(
          14,
          shape === "blob" ? 40 - level * 4 : 22 - level * 2,
        )}%, transparent)`
      : undefined;
  const ringWidth = Math.max(3, 7 - level * 0.8);

  return (
    <div
      className="group pointer-events-auto absolute z-20"
      style={{
        left: canvasPoint.x,
        top: canvasPoint.y,
        transform: "translate(-50%, -50%)",
        width: placement.w,
      }}
    >
      <motion.div
        initial={isNew ? { scale: 0.74, opacity: 0 } : { scale: 0.92, opacity: 0 }}
        animate={{
          scale: isFocused ? focusScale : 1,
          opacity: 1,
        }}
        exit={{ scale: 0.82, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative"
      >
        <div
          onPointerDown={onStartDrag}
          onClick={(event) => {
            if (isEditing) return;
            event.stopPropagation();
            onSelect();
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            onStartEdit();
          }}
          className={cn(
            "relative flex min-h-11 select-none items-center justify-center overflow-visible px-3 py-2 text-center text-sm font-medium text-foreground transition-shadow",
            isDragging ? "cursor-grabbing" : "cursor-grab",
            theme.cardClassName,
          )}
          style={{
            ...shapeStyle(shape),
            width: placement.w,
            minHeight: placement.h,
            fontFamily: theme.fontFamily,
            fontSize,
            fontWeight,
            lineHeight: 1.2,
            border: nestedBorder,
            boxShadow: isFocused ? focusedShadow : restingShadow,
            backgroundColor: isSketch ? sketchPalette.card : undefined,
            color: isSketch ? sketchPalette.ink : undefined,
          }}
        >
          {isSketch && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  ...shapeStyle(shape),
                  inset: -10 + level,
                  border: `${ringWidth}px solid ${sketchMarker.marker}`,
                  opacity: isFocused ? 0.9 : 0.72,
                  transform: `rotate(${(idea.id.charCodeAt(0) % 7) - 3}deg) scaleX(1.03)`,
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  ...shapeStyle(shape),
                  inset: -5 + level,
                  border: `${Math.max(2, ringWidth * 0.48)}px solid ${sketchMarker.markerDark}`,
                  opacity: isFocused ? 0.5 : 0.32,
                  transform: `rotate(${(idea.id.charCodeAt(idea.id.length - 1) % 9) - 4}deg) scaleY(1.04)`,
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  ...shapeStyle(shape),
                  inset: -2 + level,
                  border: `2px solid ${sketchPalette.ringHighlight}`,
                  opacity: 0.62,
                  transform: "rotate(-2deg) scaleX(0.98)",
                }}
              />
            </>
          )}
          {isEditing ? (
            <input
              autoFocus
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commit();
                } else if (event.key === "Escape") {
                  setDraftText(idea.text);
                  onCommitEdit(idea.text);
                }
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              className="w-full bg-transparent text-center outline-none"
              style={{ fontFamily: theme.fontFamily, minWidth: 60 }}
            />
          ) : (
            <span
              className={cn("relative z-10 max-w-full break-words", isSketch && "uppercase")}
              style={{
                textShadow: isSketch ? `0.7px 0.55px 0 ${sketchPalette.textShadow}` : undefined,
              }}
            >
              {idea.text}
            </span>
          )}
        </div>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className={cn(
            "absolute -right-2 -top-2 z-10 grid h-5 w-5 place-items-center bg-background/95 text-muted-foreground opacity-0 shadow-soft transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground",
            shape === "boxy" ? "rounded-[3px]" : "rounded-full",
          )}
          aria-label="Remove idea"
        >
          <X className="h-3 w-3" />
        </button>
      </motion.div>
    </div>
  );
}

type OverviewMapProps = {
  placements: Placed[];
  ideas: Idea[];
  viewportSize: { w: number; h: number };
  view: CanvasView;
  viewportStroke: string;
  onFocusWorldPoint: (point: { x: number; y: number }) => void;
};

function OverviewMap({
  placements,
  ideas,
  viewportSize,
  view,
  viewportStroke,
  onFocusWorldPoint,
}: OverviewMapProps) {
  const mapW = 190;
  const mapH = 132;
  const bounds = useMemo(() => {
    const boxes = [CENTER_BOX, ...placements];
    const minX = Math.min(...boxes.map((box) => box.x - box.w / 2)) - 260;
    const maxX = Math.max(...boxes.map((box) => box.x + box.w / 2)) + 260;
    const minY = Math.min(...boxes.map((box) => box.y - box.h / 2)) - 220;
    const maxY = Math.max(...boxes.map((box) => box.y + box.h / 2)) + 220;
    const width = Math.max(900, maxX - minX);
    const height = Math.max(620, maxY - minY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return {
      minX: cx - width / 2,
      minY: cy - height / 2,
      width,
      height,
    };
  }, [placements]);

  const scale = Math.min((mapW - 20) / bounds.width, (mapH - 20) / bounds.height);
  const offsetX = (mapW - bounds.width * scale) / 2;
  const offsetY = (mapH - bounds.height * scale) / 2;
  const mapPoint = (point: { x: number; y: number }) => ({
    x: offsetX + (point.x - bounds.minX) * scale,
    y: offsetY + (point.y - bounds.minY) * scale,
  });

  const visible = {
    x: (0 - view.x) / view.zoom - WORLD_CENTER,
    y: (0 - view.y) / view.zoom - WORLD_CENTER,
    w: viewportSize.w / view.zoom,
    h: viewportSize.h / view.zoom,
  };
  const visiblePoint = mapPoint({ x: visible.x, y: visible.y });
  const visibleRect = {
    x: clamp(visiblePoint.x, 4, mapW - 4),
    y: clamp(visiblePoint.y, 4, mapH - 4),
    w: clamp(visible.w * scale, 8, mapW - 8),
    h: clamp(visible.h * scale, 8, mapH - 8),
  };

  return (
    <button
      type="button"
      className="absolute bottom-5 left-5 z-40 block border-2 border-foreground/25 bg-card/90 p-2 text-left shadow-[4px_4px_0_color-mix(in_oklab,var(--mit)_24%,transparent)] backdrop-blur"
      style={{
        borderRadius: 3,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        width: mapW,
        height: mapH,
      }}
      aria-label="Overview map"
      onClick={(event) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        onFocusWorldPoint({
          x: (localX - offsetX) / scale + bounds.minX,
          y: (localY - offsetY) / scale + bounds.minY,
        });
      }}
    >
      <svg aria-hidden className="h-full w-full overflow-visible" viewBox={`0 0 ${mapW} ${mapH}`}>
        <rect
          x="0"
          y="0"
          width={mapW}
          height={mapH}
          rx="3"
          ry="3"
          fill="color-mix(in oklab, var(--card) 72%, transparent)"
          opacity={0.7}
        />
        {ideas.map((idea, index) => {
          const to = placements[index];
          if (!to) return null;
          const from =
            idea.parentId != null
              ? placements[ideas.findIndex((candidate) => candidate.id === idea.parentId)]
              : CENTER_BOX;
          if (!from) return null;
          const a = mapPoint(from);
          const b = mapPoint(to);
          return (
            <line
              key={idea.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-[color:var(--mit)] opacity-45"
            />
          );
        })}
        {placements.map((placement, index) => {
          const point = mapPoint(placement);
          return (
            <rect
              key={ideas[index]?.id ?? index}
              x={point.x - 2.4}
              y={point.y - 2.4}
              width="4.8"
              height="4.8"
              rx="1"
              ry="1"
              fill="currentColor"
              className="text-[color:var(--could)]"
            />
          );
        })}
        {(() => {
          const center = mapPoint(CENTER_BOX);
          return (
            <rect
              x={center.x - 4}
              y={center.y - 4}
              width="8"
              height="8"
              rx="1"
              ry="1"
              fill="currentColor"
              className="text-[color:var(--mit)]"
            />
          );
        })()}
        <rect
          x={visibleRect.x}
          y={visibleRect.y}
          width={Math.min(visibleRect.w, mapW - visibleRect.x - 4)}
          height={Math.min(visibleRect.h, mapH - visibleRect.y - 4)}
          rx="3"
          ry="3"
          fill="none"
          stroke={viewportStroke}
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

type CanvasView = { x: number; y: number; zoom: number };

type Interaction =
  | {
      type: "pan";
      pointerId: number;
      lastX: number;
      lastY: number;
      moved: boolean;
    }
  | {
      type: "node";
      pointerId: number;
      id: string;
      offsetX: number;
      offsetY: number;
      startX: number;
      startY: number;
      moved: boolean;
    };

export function Brainstorm() {
  const [state, setState] = useState<BrainstormState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragLive, setDragLive] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [centerActive, setCenterActive] = useState(false);
  const [pageTheme, setPageTheme] = useState("blossom");
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<CanvasView>({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  const initializedViewRef = useRef(false);
  const interactionRef = useRef<Interaction | null>(null);
  const dragLiveRef = useRef<typeof dragLive>(null);
  const pendingDragRef = useRef<typeof dragLive>(null);
  const dragRafRef = useRef(0);
  const cameraRafRef = useRef(0);
  const ignoreNextClickRef = useRef(false);
  const ignoreNextNodeClickRef = useRef(false);

  const shape = state.shape;
  const theme = SHAPE_THEMES[shape];
  const sketchPalette = SKETCH_PALETTES[pageTheme] ?? SKETCH_PALETTES.blossom;

  const syncTitleHeight = useCallback((element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${clamp(element.scrollHeight, TITLE_MIN_HEIGHT, TITLE_MAX_HEIGHT)}px`;
  }, []);

  const fitTitleToTwoLines = useCallback(
    (rawValue: string, element: HTMLTextAreaElement) => {
      let next = normalizeTitleValue(rawValue);

      while (next.length > 0) {
        element.value = next;
        syncTitleHeight(element);
        if (element.scrollHeight <= TITLE_MAX_HEIGHT + 1) break;
        next = next.slice(0, -1);
      }

      return next;
    },
    [syncTitleHeight],
  );

  useEffect(() => {
    const loaded = loadBrainstorm();
    setState(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveBrainstorm(state);
  }, [state, hydrated]);

  useLayoutEffect(() => {
    if (titleRef.current) syncTitleHeight(titleRef.current);
  }, [state.title, syncTitleHeight]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => setPageTheme(root.getAttribute("data-theme") ?? "blossom");
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!viewportRef.current) return;
    const element = viewportRef.current;
    const update = () => {
      const next = { w: element.clientWidth, h: element.clientHeight };
      setViewportSize(next);
      if (!initializedViewRef.current && next.w > 0 && next.h > 0) {
        initializedViewRef.current = true;
        setView({
          x: next.w / 2 - WORLD_CENTER,
          y: next.h / 2 - WORLD_CENTER,
          zoom: 1,
        });
      }
    };
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
      if (cameraRafRef.current) cancelAnimationFrame(cameraRafRef.current);
    },
    [],
  );

  const depthById = useMemo(() => computeDepthMap(state.ideas), [state.ideas]);
  const placements = useMemo(() => layoutIdeas(state.ideas, shape), [shape, state.ideas]);

  const placementById = useMemo(() => {
    const map = new Map<string, Placed>();
    state.ideas.forEach((idea, index) => {
      const placement = placements[index];
      if (placement) map.set(idea.id, placement);
    });
    return map;
  }, [placements, state.ideas]);

  const displayPlacements = useMemo(
    () =>
      placements.map((placement, index) => {
        const idea = state.ideas[index];
        return dragLive && idea?.id === dragLive.id
          ? { ...placement, x: dragLive.x, y: dragLive.y }
          : placement;
      }),
    [dragLive, placements, state.ideas],
  );

  const animateViewTo = useCallback((target: CanvasView, duration = 360) => {
    if (cameraRafRef.current) cancelAnimationFrame(cameraRafRef.current);
    const start = viewRef.current;
    const startedAt = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = ease(progress);
      const next = {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        zoom: start.zoom + (target.zoom - start.zoom) * eased,
      };
      viewRef.current = next;
      setView(next);

      if (progress < 1) {
        cameraRafRef.current = requestAnimationFrame(step);
      } else {
        cameraRafRef.current = 0;
      }
    };

    cameraRafRef.current = requestAnimationFrame(step);
  }, []);

  const focusBoxes = useCallback(
    (boxes: Placed[], animated = true) => {
      if (boxes.length === 0 || viewportSize.w === 0 || viewportSize.h === 0) return;
      const minX = Math.min(...boxes.map((box) => box.x - box.w / 2)) - 180;
      const maxX = Math.max(...boxes.map((box) => box.x + box.w / 2)) + 180;
      const minY = Math.min(...boxes.map((box) => box.y - box.h / 2)) - 150;
      const maxY = Math.max(...boxes.map((box) => box.y + box.h / 2)) + 190;
      const neededZoom = Math.min(
        viewportSize.w / Math.max(1, maxX - minX),
        viewportSize.h / Math.max(1, maxY - minY),
      );
      const zoom = clamp(Math.min(viewRef.current.zoom, neededZoom), MIN_ZOOM, MAX_ZOOM);
      const target = {
        zoom,
        x: viewportSize.w / 2 - (WORLD_CENTER + (minX + maxX) / 2) * zoom,
        y: viewportSize.h / 2 - (WORLD_CENTER + (minY + maxY) / 2) * zoom,
      };
      if (animated) animateViewTo(target);
      else {
        viewRef.current = target;
        setView(target);
      }
    },
    [animateViewTo, viewportSize.h, viewportSize.w],
  );

  const getBranchBoxes = useCallback(
    (id: string, extraBoxes: Placed[] = []) => {
      const ids = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        state.ideas.forEach((idea) => {
          if (idea.parentId && ids.has(idea.parentId) && !ids.has(idea.id)) {
            ids.add(idea.id);
            changed = true;
          }
        });
      }

      const boxes = state.ideas.flatMap((idea, index) => {
        if (!ids.has(idea.id)) return [];
        const placement = displayPlacements[index];
        return placement ? [placement] : [];
      });
      return [...boxes, ...extraBoxes];
    },
    [displayPlacements, state.ideas],
  );

  const selectIdea = useCallback(
    (id: string, options: { center?: boolean } = {}) => {
      setFocusedId(id);
      setCenterActive(false);
      if (options.center) focusBoxes(getBranchBoxes(id));
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [focusBoxes, getBranchBoxes],
  );

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const current = viewRef.current;
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - current.x) / current.zoom - WORLD_CENTER,
      y: (clientY - rect.top - current.y) / current.zoom - WORLD_CENTER,
    };
  }, []);

  const focusWorldPoint = useCallback(
    (point: { x: number; y: number }, zoom = viewRef.current.zoom, animated = false) => {
      const target = {
        zoom,
        x: viewportSize.w / 2 - (WORLD_CENTER + point.x) * zoom,
        y: viewportSize.h / 2 - (WORLD_CENTER + point.y) * zoom,
      };
      if (animated) animateViewTo(target);
      else {
        viewRef.current = target;
        setView(target);
      }
    },
    [animateViewTo, viewportSize.h, viewportSize.w],
  );

  const scheduleDragLive = useCallback((next: { id: string; x: number; y: number }) => {
    pendingDragRef.current = next;
    dragLiveRef.current = next;
    if (dragRafRef.current) return;
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = 0;
      setDragLive(pendingDragRef.current);
    });
  }, []);

  const addIdea = () => {
    const text = draft.trim();
    if (!text) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const parentId = focusedId ?? undefined;
    const depth = parentId ? (depthById.get(parentId) ?? 0) + 1 : 0;
    const size = estimateCardSize(text, shape, depth);
    const parent = parentId ? (placementById.get(parentId) ?? CENTER_BOX) : CENTER_BOX;
    const parentIdea = parentId ? state.ideas.find((idea) => idea.id === parentId) : undefined;
    const parentOrigin =
      parentIdea?.parentId != null
        ? (placementById.get(parentIdea.parentId) ?? CENTER_BOX)
        : CENTER_BOX;
    const preferredAngle =
      shape === "blob" && parentId
        ? Math.atan2(parent.y - parentOrigin.y, parent.x - parentOrigin.x)
        : undefined;
    const occupied = [CENTER_BOX, ...displayPlacements];
    const siblingIndex = state.ideas.filter(
      (idea) => (idea.parentId ?? "center") === (parentId ?? "center"),
    ).length;
    const placement = findOpenSpot(parent, size, occupied, siblingIndex, shape, preferredAngle);

    setState((current) => ({
      ...current,
      ideas: [
        ...current.ideas,
        {
          id,
          text,
          parentId,
          cx: placement.x,
          cy: placement.y,
        },
      ],
    }));
    setLastAddedId(id);
    setDraft("");
    if (parentId) {
      focusBoxes(getBranchBoxes(parentId, [placement]));
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeIdea = (id: string) => {
    setState((current) => ({
      ...current,
      ideas: current.ideas
        .filter((idea) => idea.id !== id)
        .map((idea) => (idea.parentId === id ? { ...idea, parentId: undefined } : idea)),
    }));
    if (focusedId === id) setFocusedId(null);
    if (editingId === id) setEditingId(null);
    if (dragLive?.id === id) setDragLive(null);
  };

  const commitEdit = (id: string, text: string) => {
    setState((current) => ({
      ...current,
      ideas: current.ideas.map((idea) => (idea.id === id ? { ...idea, text } : idea)),
    }));
    setEditingId(null);
  };

  const persistDraggedIdea = (id: string, x: number, y: number) => {
    setState((current) => ({
      ...current,
      ideas: current.ideas.map((idea) => (idea.id === id ? { ...idea, cx: x, cy: y } : idea)),
    }));
  };

  const handleViewportPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      type: "pan",
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
  };

  const handleNodePointerDown = (
    id: string,
    placement: Placed,
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (event.button !== 0 || editingId === id) return;
    event.stopPropagation();
    viewportRef.current?.setPointerCapture(event.pointerId);
    const point = screenToWorld(event.clientX, event.clientY);
    setFocusedId(id);
    setCenterActive(false);
    interactionRef.current = {
      type: "node",
      pointerId: event.pointerId,
      id,
      offsetX: point.x - placement.x,
      offsetY: point.y - placement.y,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    if (interaction.type === "pan") {
      const dx = event.clientX - interaction.lastX;
      const dy = event.clientY - interaction.lastY;
      if (Math.hypot(dx, dy) > 0.5) interaction.moved = true;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      setView((current) => {
        const next = {
          ...current,
          x: current.x + dx,
          y: current.y + dy,
        };
        viewRef.current = next;
        return next;
      });
      return;
    }

    const distance = Math.hypot(
      event.clientX - interaction.startX,
      event.clientY - interaction.startY,
    );
    if (distance > 3) interaction.moved = true;
    const point = screenToWorld(event.clientX, event.clientY);
    scheduleDragLive({
      id: interaction.id,
      x: point.x - interaction.offsetX,
      y: point.y - interaction.offsetY,
    });
  };

  const endInteraction = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    if (interaction.moved) {
      ignoreNextClickRef.current = true;
      window.setTimeout(() => {
        ignoreNextClickRef.current = false;
      }, 120);
    }

    if (interaction.type === "node") {
      ignoreNextClickRef.current = true;
      window.setTimeout(() => {
        ignoreNextClickRef.current = false;
      }, 120);
      const live = dragLiveRef.current;
      if (live && live.id === interaction.id && interaction.moved) {
        persistDraggedIdea(interaction.id, live.x, live.y);
      }
      if (interaction.moved) {
        ignoreNextNodeClickRef.current = true;
        setFocusedId(null);
        window.setTimeout(() => {
          ignoreNextNodeClickRef.current = false;
        }, 120);
      } else {
        selectIdea(interaction.id, { center: true });
      }
      dragLiveRef.current = null;
      pendingDragRef.current = null;
      setDragLive(null);
    }

    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId);
    }
    interactionRef.current = null;
  };

  const zoomAtClientPoint = useCallback((clientX: number, clientY: number, deltaY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const current = viewRef.current;
    const nextZoom = clamp(current.zoom * Math.exp(-deltaY * 0.001), MIN_ZOOM, MAX_ZOOM);
    const canvasX = (clientX - rect.left - current.x) / current.zoom;
    const canvasY = (clientY - rect.top - current.y) / current.zoom;
    const next = {
      zoom: nextZoom,
      x: clientX - rect.left - canvasX * nextZoom,
      y: clientY - rect.top - canvasY * nextZoom,
    };

    viewRef.current = next;
    setView(next);
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const nextZoom = clamp(viewRef.current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const visibleCenter = {
        x: (viewportSize.w / 2 - viewRef.current.x) / viewRef.current.zoom - WORLD_CENTER,
        y: (viewportSize.h / 2 - viewRef.current.y) / viewRef.current.zoom - WORLD_CENTER,
      };
      focusWorldPoint(visibleCenter, nextZoom);
    },
    [focusWorldPoint, viewportSize.h, viewportSize.w],
  );

  const fitChart = useCallback(() => {
    const boxes = [CENTER_BOX, ...displayPlacements];
    const minX = Math.min(...boxes.map((box) => box.x - box.w / 2)) - 180;
    const maxX = Math.max(...boxes.map((box) => box.x + box.w / 2)) + 180;
    const minY = Math.min(...boxes.map((box) => box.y - box.h / 2)) - 160;
    const maxY = Math.max(...boxes.map((box) => box.y + box.h / 2)) + 160;
    const chartW = Math.max(1, maxX - minX);
    const chartH = Math.max(1, maxY - minY);
    const nextZoom = clamp(
      Math.min(viewportSize.w / chartW, viewportSize.h / chartH),
      MIN_ZOOM,
      1.35,
    );
    focusWorldPoint({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, nextZoom);
  }, [displayPlacements, focusWorldPoint, viewportSize.h, viewportSize.w]);

  useEffect(() => {
    const handleNativeWheel = (event: WheelEvent) => {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node) || !root.contains(event.target)) return;
      event.preventDefault();
      zoomAtClientPoint(event.clientX, event.clientY, event.deltaY);
    };
    const preventBrowserGesture = (event: Event) => event.preventDefault();

    window.addEventListener("wheel", handleNativeWheel, { passive: false, capture: true });
    document.addEventListener("gesturestart", preventBrowserGesture, { passive: false });
    document.addEventListener("gesturechange", preventBrowserGesture, { passive: false });
    document.addEventListener("gestureend", preventBrowserGesture, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleNativeWheel, { capture: true });
      document.removeEventListener("gesturestart", preventBrowserGesture);
      document.removeEventListener("gesturechange", preventBrowserGesture);
      document.removeEventListener("gestureend", preventBrowserGesture);
    };
  }, [zoomAtClientPoint]);

  useEffect(() => {
    const handleKeyZoom = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(1.16);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomBy(0.86);
      } else if (event.key === "0") {
        event.preventDefault();
        fitChart();
      }
    };

    window.addEventListener("keydown", handleKeyZoom, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyZoom, { capture: true });
  }, [fitChart, zoomBy]);

  const clearCanvasSelection = () => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    setFocusedId(null);
    setCenterActive(false);
    focusWorldPoint({ x: 0, y: 0 }, viewRef.current.zoom, true);
  };

  const handleCanvasClick = () => {
    clearCanvasSelection();
  };

  const protectInteractiveClick = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const titlePoint = toCanvasPoint(CENTER_BOX);

  return (
    <div
      ref={rootRef}
      className="relative h-screen w-screen overflow-hidden"
      style={{
        fontFamily: theme.fontFamily,
        background:
          shape === "blob"
            ? `radial-gradient(circle at 28% 18%, ${sketchPalette.paperAccent}, transparent 24%), radial-gradient(circle at 74% 76%, ${sketchPalette.markerGlow}, transparent 22%), ${sketchPalette.paper}`
            : undefined,
        color: shape === "blob" ? sketchPalette.ink : undefined,
      }}
    >
      {shape === "blob" ? (
        <SketchDoodles palette={sketchPalette} />
      ) : (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--could)] opacity-45 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 -right-24 h-80 w-80 rounded-full bg-[color:var(--mit)] opacity-42 blur-3xl"
          />
        </>
      )}

      <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between px-5 py-4">
        <Link
          to="/"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-card/90",
            theme.controlClassName,
          )}
          style={controlStyle(shape, theme, sketchPalette)}
          onClick={(event) => event.stopPropagation()}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to today
        </Link>
        <div className="flex items-center gap-2">
          <ThemePicker
            buttonClassName={cn("h-10 w-10 transition hover:bg-card/90", theme.controlClassName)}
            iconClassName="h-4 w-4"
            buttonStyle={{
              ...controlStyle(shape, theme, sketchPalette),
              height: 40,
              width: 40,
            }}
            panelStyle={controlStyle(shape, theme, sketchPalette)}
            swatchShapeStyle={shapeStyle(shape)}
          />
          <motion.button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setConfirmOpen(true);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "grid h-10 w-10 place-items-center text-foreground",
              theme.controlClassName,
            )}
            style={controlStyle(shape, theme, sketchPalette)}
            aria-label="Reset brainstorm"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={cn(
          "absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing",
          interactionRef.current?.type === "node" && "cursor-default",
        )}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
        onClick={handleCanvasClick}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          width={viewportSize.w}
          height={viewportSize.h}
        >
          {state.ideas.map((idea, index) => {
            const to = displayPlacements[index];
            if (!to) return null;
            const parentIndex = idea.parentId
              ? state.ideas.findIndex((candidate) => candidate.id === idea.parentId)
              : -1;
            const from = parentIndex >= 0 ? displayPlacements[parentIndex] : CENTER_BOX;
            if (!from) return null;
            const isNew = idea.id === lastAddedId;
            const isSelectedOutgoing = focusedId != null && idea.parentId === focusedId;
            const start = toScreenPoint(from, view);
            const end = toScreenPoint(to, view);
            const path = connectorPathFromPoints(start, end, theme.lineMode, index);
            const lineLevel = depthLevel(depthById.get(idea.id) ?? 0);
            const lineScale = Math.max(0.58, 1 - lineLevel * 0.11);
            const sketchMarker = sketchMarkerForDepth(sketchPalette, depthById.get(idea.id) ?? 0);
            const markerId = `sketch-arrowhead-${safeSvgId(idea.id)}`;
            return (
              <g key={idea.id}>
                {shape === "blob" && (
                  <defs>
                    <marker
                      id={markerId}
                      markerWidth="14"
                      markerHeight="14"
                      refX="12"
                      refY="7"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path
                        d="M 1 1 L 12 7 L 1 13"
                        fill="none"
                        stroke={sketchMarker.line}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </marker>
                  </defs>
                )}
                {isSelectedOutgoing && shape !== "blob" && (
                  <motion.path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={8 * lineScale}
                    strokeLinecap={shape === "boxy" ? "square" : "round"}
                    strokeLinejoin={shape === "boxy" ? "miter" : "round"}
                    className="text-[color:var(--mit)] opacity-25"
                    initial={isNew ? { pathLength: 0, opacity: 0 } : false}
                    animate={{ pathLength: 1, opacity: 0.25 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    style={{
                      filter:
                        "drop-shadow(0 0 10px color-mix(in oklab, var(--mit) 70%, transparent))",
                    }}
                  />
                )}
                <motion.path
                  d={path}
                  fill="none"
                  stroke={shape === "blob" ? sketchMarker.line : "currentColor"}
                  strokeWidth={
                    (isSelectedOutgoing
                      ? shape === "blob"
                        ? 3
                        : 3.4
                      : shape === "boxy"
                        ? 1.5
                        : shape === "blob"
                          ? 2.2
                          : 2) * lineScale
                  }
                  strokeLinecap={shape === "boxy" ? "square" : "round"}
                  strokeLinejoin={shape === "boxy" ? "miter" : "round"}
                  markerEnd={shape === "blob" ? `url(#${markerId})` : undefined}
                  className={cn(
                    shape !== "blob" && "text-[color:var(--mit)]",
                    isSelectedOutgoing
                      ? "opacity-95"
                      : shape === "blob"
                        ? "opacity-75"
                        : "opacity-55",
                  )}
                  initial={isNew ? { pathLength: 0, opacity: 0 } : false}
                  animate={{
                    pathLength: 1,
                    opacity: isSelectedOutgoing ? 0.95 : shape === "blob" ? 0.75 : 0.55,
                  }}
                  transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                />
              </g>
            );
          })}
        </svg>

        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{
            width: 0,
            height: 0,
            overflow: "visible",
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <div
            className="pointer-events-auto absolute z-10"
            style={{
              left: titlePoint.x,
              top: titlePoint.y,
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={protectInteractiveClick}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={cn(
                "relative",
                shape === "blob" ? "bg-transparent p-[10px]" : "bg-gradient-mit p-[2px]",
              )}
              style={{
                ...shapeStyle(shape),
                filter:
                  shape === "blob"
                    ? "none"
                    : "drop-shadow(10px 12px 18px color-mix(in oklab, var(--mit) 24%, transparent)) drop-shadow(2px 4px 8px color-mix(in oklab, var(--foreground) 10%, transparent))",
              }}
            >
              {shape === "blob" && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      ...shapeStyle(shape),
                      border: `8px solid ${sketchPalette.marker}`,
                      opacity: 0.78,
                      transform: "rotate(-1.7deg) scaleX(1.03)",
                    }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-1"
                    style={{
                      ...shapeStyle(shape),
                      border: `4px solid ${sketchPalette.markerDark}`,
                      opacity: 0.34,
                      transform: "rotate(1.4deg) scaleY(1.04)",
                    }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-3"
                    style={{
                      ...shapeStyle(shape),
                      border: `2px solid ${sketchPalette.ringHighlight}`,
                      opacity: 0.68,
                      transform: "rotate(-2deg) scaleX(0.98)",
                    }}
                  />
                </>
              )}
              <textarea
                ref={titleRef}
                value={state.title}
                onChange={(event) => {
                  const title = fitTitleToTwoLines(event.currentTarget.value, event.currentTarget);
                  setState((current) => ({
                    ...current,
                    title,
                  }));
                }}
                onFocus={(event) => {
                  event.currentTarget.select();
                  setFocusedId(null);
                  setCenterActive(true);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  setFocusedId(null);
                  setCenterActive(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.currentTarget.value.includes("\n")) {
                    event.preventDefault();
                  }
                }}
                maxLength={MAX_TITLE_CHARS}
                rows={1}
                className={cn(
                  "block min-h-[4.5rem] max-h-[6.625rem] resize-none overflow-hidden text-center outline-none",
                  shape === "blob"
                    ? "relative z-10 w-[22rem] px-5 py-4 text-4xl font-black uppercase leading-[0.96] focus:ring-0"
                    : "w-[22rem] bg-card/95 px-8 py-5 text-2xl font-semibold leading-[1.15] text-foreground focus:ring-2 focus:ring-[color:var(--mit)]",
                )}
                style={{
                  ...shapeStyle(shape),
                  backgroundColor: shape === "blob" ? sketchPalette.card : undefined,
                  color: shape === "blob" ? sketchPalette.ink : undefined,
                  fontFamily:
                    shape === "blob"
                      ? '"Marker Felt", "Arial Black", "Chalkboard SE", "Comic Sans MS", ui-sans-serif, system-ui, sans-serif'
                      : theme.fontFamily,
                  textShadow:
                    shape === "blob" ? `1.3px 1.1px 0 ${sketchPalette.textShadow}` : undefined,
                }}
                aria-label="Brainstorm title"
              />
            </div>

            <AnimatePresence>
              {centerActive && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className={cn(
                    "absolute left-1/2 top-full mt-4 flex -translate-x-1/2 gap-1.5 p-2 shadow-pop backdrop-blur",
                    theme.controlClassName,
                  )}
                  style={controlStyle(shape, theme, sketchPalette)}
                  onClick={(event) => event.stopPropagation()}
                >
                  {SHAPES.map((candidate) => (
                    <button
                      key={candidate.key}
                      type="button"
                      onClick={() =>
                        setState((current) => ({
                          ...current,
                          shape: candidate.key,
                        }))
                      }
                      className={cn(
                        "grid h-10 w-10 place-items-center transition",
                        shape === candidate.key
                          ? "bg-gradient-mit text-primary-foreground shadow-soft"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                      )}
                      style={{
                        ...shapeStyle(candidate.key),
                        fontFamily: SHAPE_THEMES[candidate.key].fontFamily,
                      }}
                      aria-label={candidate.label}
                      title={candidate.label}
                    >
                      <span
                        className="block h-4 w-4 bg-current opacity-80"
                        style={shapeStyle(candidate.key)}
                      />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {state.ideas.map((idea, index) => {
              const placement = displayPlacements[index];
              if (!placement) return null;
              return (
                <IdeaNode
                  key={idea.id}
                  idea={idea}
                  placement={placement}
                  depth={depthById.get(idea.id) ?? 0}
                  shape={shape}
                  theme={theme}
                  sketchPalette={sketchPalette}
                  sketchMarker={sketchMarkerForDepth(sketchPalette, depthById.get(idea.id) ?? 0)}
                  isNew={idea.id === lastAddedId}
                  isFocused={focusedId === idea.id}
                  isEditing={editingId === idea.id}
                  isDragging={dragLive?.id === idea.id}
                  onRemove={() => removeIdea(idea.id)}
                  onSelect={() => {
                    if (ignoreNextNodeClickRef.current) {
                      ignoreNextNodeClickRef.current = false;
                      return;
                    }
                    selectIdea(idea.id, { center: true });
                  }}
                  onStartEdit={() => setEditingId(idea.id)}
                  onCommitEdit={(text) => commitEdit(idea.id, text)}
                  onStartDrag={(event) => handleNodePointerDown(idea.id, placement, event)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <OverviewMap
        placements={displayPlacements}
        ideas={state.ideas}
        viewportSize={viewportSize}
        view={view}
        viewportStroke={PAGE_THEME_VIEWPORT_STROKE[pageTheme] ?? "currentColor"}
        onFocusWorldPoint={(point) => focusWorldPoint(point)}
      />

      <div
        className="absolute bottom-5 right-5 z-40 flex flex-col gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={cn(
            "grid h-10 w-10 place-items-center text-foreground transition hover:bg-card/90",
            theme.controlClassName,
          )}
          style={controlStyle(shape, theme, sketchPalette)}
          onClick={() => zoomBy(1.16)}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            "grid h-10 w-10 place-items-center text-foreground transition hover:bg-card/90",
            theme.controlClassName,
          )}
          style={controlStyle(shape, theme, sketchPalette)}
          onClick={() => zoomBy(0.86)}
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            "grid h-10 w-10 place-items-center text-foreground transition hover:bg-card/90",
            theme.controlClassName,
          )}
          style={controlStyle(shape, theme, sketchPalette)}
          onClick={fitChart}
          aria-label="Fit brainstorm"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      <div
        className="absolute bottom-6 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={cn(
            "relative",
            shape === "blob" ? "bg-transparent p-[7px]" : "bg-gradient-mit p-[2px] shadow-soft",
          )}
          style={shapeStyle(shape)}
        >
          {shape === "blob" && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  ...shapeStyle(shape),
                  border: `6px solid ${sketchPalette.marker}`,
                  opacity: 0.72,
                  transform: "rotate(-1.5deg)",
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-1"
                style={{
                  ...shapeStyle(shape),
                  border: `3px solid ${sketchPalette.markerDark}`,
                  opacity: 0.32,
                  transform: "rotate(1.2deg)",
                }}
              />
            </>
          )}
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addIdea();
              }
            }}
            placeholder={
              focusedId ? "Add a linked idea, press Enter..." : "Add an idea, press Enter..."
            }
            className={cn(
              "relative z-10 w-full px-5 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-[color:var(--mit)]",
              shape === "blob"
                ? "placeholder:text-[color:var(--sketch-placeholder)]"
                : "bg-card/95 text-foreground placeholder:text-muted-foreground",
            )}
            style={{
              ...shapeStyle(shape),
              backgroundColor: shape === "blob" ? sketchPalette.card : undefined,
              color: shape === "blob" ? sketchPalette.ink : undefined,
              ["--sketch-placeholder" as string]: sketchPalette.placeholder,
              fontFamily: theme.fontFamily,
              textAlign: shape === "blob" ? "center" : "left",
            }}
            autoFocus
          />
        </div>
      </div>

      <ResetDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setState(EMPTY);
          setFocusedId(null);
          setEditingId(null);
          setDragLive(null);
          setDraft("");
          setConfirmOpen(false);
          focusWorldPoint({ x: 0, y: 0 }, 1);
        }}
      />
    </div>
  );
}

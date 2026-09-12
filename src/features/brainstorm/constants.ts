import type { BrainstormLibrary, BrainstormState, Placed, ShapeKey } from "./types";

export const LEGACY_STORAGE_KEY = "one-good-day:brainstorm:v2";
export const STORAGE_KEY = "one-good-day:brainstorms:v1";

export const EMPTY: BrainstormState = {
  version: 4,
  title: "Options",
  ideas: [{ id: "root", text: "Options", cx: 0, cy: 0 }],
  shape: "blob",
};

export const EMPTY_LIBRARY: BrainstormLibrary = {
  version: 4,
  activeId: "default",
  brainstorms: [
    {
      ...EMPTY,
      id: "default",
      updatedAt: 0,
    },
  ],
};

export const SHAPES: { key: ShapeKey; label: string }[] = [
  { key: "pill", label: "Soft" },
  { key: "boxy", label: "Square" },
  { key: "blob", label: "Sketch" },
];

export const VALID_SHAPES = new Set<ShapeKey>(SHAPES.map((shape) => shape.key));

export const WORLD_SIZE = 100000;
export const WORLD_CENTER = WORLD_SIZE / 2;
export const MIN_ZOOM = 0.18;
export const MAX_ZOOM = 2.25;
export const MAX_CARD_W = 230;
export const MAX_TITLE_CHARS = 64;
export const TITLE_MIN_HEIGHT = 72;
export const TITLE_MAX_HEIGHT = 106;
export const CHAR_W = 8.2;
export const PAD_X = 30;
export const LINE_H = 22;
export const PAD_Y = 24;
export const CENTER_BOX: Placed = { x: 0, y: 0, w: 360, h: 124 };
export const ROOT_NODE_BOX: Placed = { x: 0, y: 0, w: 360, h: 104 };
export const GOLDEN_DEG = 137.50776;
export const OUTWARD_CHILD_SLOTS = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5];

export const PAGE_THEME_VIEWPORT_STROKE: Record<string, string> = {
  sakura: "#7c3aed",
  blossom: "#9a4f19",
  meadow: "#9a6a00",
  nebula: "currentColor",
  starry: "currentColor",
};

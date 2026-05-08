import {
  CENTER_BOX,
  CHAR_W,
  GOLDEN_DEG,
  LINE_H,
  MAX_CARD_W,
  OUTWARD_CHILD_SLOTS,
  PAD_X,
  PAD_Y,
} from "./constants";
import { computeDepthMap, depthLevel, ideaFontSize } from "./graph";
import { isFiniteNumber } from "./math";
import type { Idea, Placed, ShapeKey } from "./types";

export function estimateCardSize(
  text: string,
  shape: ShapeKey,
  depth = 0,
): { w: number; h: number } {
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

export function rectsOverlap(a: Placed, b: Placed, margin = 24): boolean {
  return !(
    a.x + a.w / 2 + margin < b.x - b.w / 2 ||
    a.x - a.w / 2 - margin > b.x + b.w / 2 ||
    a.y + a.h / 2 + margin < b.y - b.h / 2 ||
    a.y - a.h / 2 - margin > b.y + b.h / 2
  );
}

export function findOpenSpot(
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

export function layoutIdeas(ideas: Idea[], shape: ShapeKey): Placed[] {
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

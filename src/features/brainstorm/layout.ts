import {
  CENTER_BOX,
  CHAR_W,
  GOLDEN_DEG,
  LINE_H,
  MAX_CARD_W,
  OUTWARD_CHILD_SLOTS,
  PAD_X,
  PAD_Y,
  ROOT_NODE_BOX,
} from "./constants";
import { computeDepthMap, depthLevel, ideaFontSize } from "./graph";
import { clamp, isFiniteNumber } from "./math";
import type { Idea, Placed, ShapeKey } from "./types";

export type PlacementBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

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

export function estimateRootSize(text: string, shape: ShapeKey): { w: number; h: number } {
  const charW = shape === "boxy" ? 12 : shape === "blob" ? 14 : 11.2;
  const maxW = shape === "blob" ? 390 : 360;
  const minW = shape === "blob" ? 250 : 230;
  const oneLine = text.length * charW + 84;
  const lines = oneLine <= maxW ? 1 : 2;

  return {
    w: Math.min(maxW, Math.max(minW, oneLine)),
    h: shape === "blob" ? (lines === 1 ? 96 : 116) : lines === 1 ? 86 : 106,
  };
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

export function findOpenRootSpot(
  preferredCenter: { x: number; y: number },
  size: { w: number; h: number },
  occupied: Placed[],
  rootIndex: number,
): Placed {
  const preferred = {
    x: preferredCenter.x,
    y: preferredCenter.y,
    w: size.w,
    h: size.h,
  };

  if (!occupied.some((placed) => rectsOverlap(preferred, placed, 54))) {
    return preferred;
  }

  const startAngle = (rootIndex * GOLDEN_DEG - 24) * (Math.PI / 180);
  for (let ring = 1; ring <= 16; ring += 1) {
    const radius = 460 + ring * 210;
    const slots = Math.max(8, ring * 6);
    for (let slot = 0; slot < slots; slot += 1) {
      const angle = startAngle + (slot / slots) * Math.PI * 2;
      const rect = {
        x: preferredCenter.x + Math.cos(angle) * radius,
        y: preferredCenter.y + Math.sin(angle) * radius,
        w: size.w,
        h: size.h,
      };
      if (!occupied.some((placed) => rectsOverlap(rect, placed, 54))) {
        return rect;
      }
    }
  }

  return {
    x: preferredCenter.x + rootIndex * 520,
    y: preferredCenter.y + Math.sin(rootIndex) * 280,
    w: size.w,
    h: size.h,
  };
}

function rectInsideBounds(rect: Placed, bounds: PlacementBounds): boolean {
  return (
    rect.x - rect.w / 2 >= bounds.minX &&
    rect.x + rect.w / 2 <= bounds.maxX &&
    rect.y - rect.h / 2 >= bounds.minY &&
    rect.y + rect.h / 2 <= bounds.maxY
  );
}

export function findOpenRootSpotInBounds(
  preferredCenter: { x: number; y: number },
  size: { w: number; h: number },
  occupied: Placed[],
  rootIndex: number,
  bounds: PlacementBounds,
): Placed | null {
  const minX = bounds.minX + size.w / 2;
  const maxX = bounds.maxX - size.w / 2;
  const minY = bounds.minY + size.h / 2;
  const maxY = bounds.maxY - size.h / 2;

  if (minX > maxX || minY > maxY) return null;

  const makeRect = (x: number, y: number) => ({
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY),
    w: size.w,
    h: size.h,
  });

  const preferred = makeRect(preferredCenter.x, preferredCenter.y);
  if (
    rectInsideBounds(preferred, bounds) &&
    !occupied.some((placed) => rectsOverlap(preferred, placed, 54))
  ) {
    return preferred;
  }

  const startAngle = (rootIndex * GOLDEN_DEG - 24) * (Math.PI / 180);
  const maxRadius = Math.max(180, Math.hypot(maxX - minX, maxY - minY) / 2);
  for (let radius = 150; radius <= maxRadius; radius += 78) {
    const slots = Math.max(10, Math.ceil((radius / 120) * 8));
    for (let slot = 0; slot < slots; slot += 1) {
      const angle = startAngle + (slot / slots) * Math.PI * 2;
      const rect = makeRect(
        preferredCenter.x + Math.cos(angle) * radius,
        preferredCenter.y + Math.sin(angle) * radius,
      );
      if (
        rectInsideBounds(rect, bounds) &&
        !occupied.some((placed) => rectsOverlap(rect, placed, 54))
      ) {
        return rect;
      }
    }
  }

  return null;
}

export function layoutIdeas(ideas: Idea[], shape: ShapeKey): Placed[] {
  const byId = new Map(ideas.map((idea, index) => [idea.id, { idea, index }]));
  const depthById = computeDepthMap(ideas);
  const placed = new Map<string, Placed>();
  const occupied: Placed[] = [];
  const siblingCounts = new Map<string, number>();
  const rootOrder = new Map<string, number>();
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
    const isRoot = !idea.parentId || !byId.has(idea.parentId);
    const rootIndex = isRoot ? (rootOrder.get(idea.id) ?? rootOrder.size) : -1;
    if (isRoot && !rootOrder.has(idea.id)) {
      rootOrder.set(idea.id, rootIndex);
    }
    const size = isRoot
      ? estimateRootSize(idea.text, shape)
      : estimateCardSize(idea.text, shape, depthById.get(idea.id) ?? 0);
    let rect: Placed;

    if (isFiniteNumber(idea.cx) && isFiniteNumber(idea.cy)) {
      rect = { x: idea.cx, y: idea.cy, ...size };
    } else if (isRoot) {
      rect =
        rootIndex === 0
          ? { ...ROOT_NODE_BOX, ...size }
          : findOpenRootSpot({ x: 0, y: 0 }, size, occupied, rootIndex);
    } else {
      const parentInfo = byId.get(idea.parentId!);
      const parent = parentInfo ? placeIdea(parentInfo.idea) : CENTER_BOX;
      const grandparentInfo = parentInfo?.idea.parentId
        ? byId.get(parentInfo.idea.parentId)
        : undefined;
      const parentOrigin = grandparentInfo ? placeIdea(grandparentInfo.idea) : parent;
      const preferredAngle =
        shape === "blob" && parentInfo && grandparentInfo
          ? Math.atan2(parent.y - parentOrigin.y, parent.x - parentOrigin.x)
          : undefined;
      const parentKey = idea.parentId!;
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

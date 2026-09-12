import {
  EMPTY,
  EMPTY_LIBRARY,
  LEGACY_STORAGE_KEY,
  MAX_TITLE_CHARS,
  STORAGE_KEY,
  VALID_SHAPES,
} from "./constants";
import { isFiniteNumber } from "./math";
import type {
  BrainstormDoc,
  BrainstormLibrary,
  BrainstormState,
  Idea,
  IdeaKind,
  LegacyShapeKey,
  ShapeKey,
} from "./types";

export function normalizeShape(shape: unknown): ShapeKey {
  if (shape === "rounded" || shape === "spiky") return "pill";
  if (shape === "hex") return "blob";
  return typeof shape === "string" && VALID_SHAPES.has(shape as ShapeKey)
    ? (shape as ShapeKey)
    : EMPTY.shape;
}

export function normalizeIdeaKind(kind: unknown): IdeaKind | undefined {
  if (kind === "decision") return "action";
  return kind === "task" || kind === "note" || kind === "action" ? kind : undefined;
}

export function normalizeTitleValue(value: string) {
  return value.split("\n").slice(0, 2).join("\n").slice(0, MAX_TITLE_CHARS);
}

function normalizeTitleKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function numberedTitle(baseTitle: string, number: number) {
  const suffix = ` ${number}`;
  return normalizeTitleValue(`${baseTitle.slice(0, MAX_TITLE_CHARS - suffix.length)}${suffix}`);
}

export function nextAvailableBrainstormTitle(baseTitle: string, existingTitles: string[]) {
  const base = normalizeTitleValue(baseTitle.trim().replace(/\s+/g, " ") || EMPTY.title);
  const existing = new Set(existingTitles.map(normalizeTitleKey));

  if (!existing.has(normalizeTitleKey(base))) return base;

  for (let number = 2; number < 1000; number += 1) {
    const candidate = numberedTitle(base, number);
    if (!existing.has(normalizeTitleKey(candidate))) return candidate;
  }

  return numberedTitle(base, Date.now());
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createBrainstormDoc(state: Partial<BrainstormState> = {}): BrainstormDoc {
  const title = state.title ?? EMPTY.title;
  const ideas =
    state.ideas?.length === 1 &&
    state.ideas[0].id === "root" &&
    state.ideas[0].text === EMPTY.title &&
    title !== EMPTY.title
      ? [{ ...state.ideas[0], text: title }]
      : (state.ideas ?? EMPTY.ideas.map((idea) => ({ ...idea, text: title })));
  const nextState = normalizeBrainstormState({
    ...EMPTY,
    ...state,
    title,
    ideas,
  });

  return {
    ...nextState,
    id: makeId("brainstorm"),
    updatedAt: Date.now(),
  };
}

function uniqueId(baseId: string, seen: Set<string>) {
  if (!seen.has(baseId)) {
    seen.add(baseId);
    return baseId;
  }

  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${baseId}-${index}`;
    if (!seen.has(candidate)) {
      seen.add(candidate);
      return candidate;
    }
  }

  const fallback = `${baseId}-${seen.size + 1}`;
  seen.add(fallback);
  return fallback;
}

export function normalizeBrainstormState(raw: unknown): BrainstormState {
  const parsed = (raw ?? {}) as Partial<
    Omit<BrainstormState, "shape"> & {
      shape?: LegacyShapeKey;
      version?: number;
      ideas?: Partial<Idea>[];
    }
  >;
  const schemaVersion = typeof parsed.version === "number" ? parsed.version : 0;
  const legacyCoords = schemaVersion < 3;
  const viewportOffsetX = typeof window === "undefined" ? 0 : window.innerWidth / 2;
  const viewportOffsetY = typeof window === "undefined" ? 0 : window.innerHeight / 2;
  const seen = new Set<string>();
  const title = typeof parsed.title === "string" ? normalizeTitleValue(parsed.title) : EMPTY.title;
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
              typeof idea.parentId === "string" && idea.parentId !== id ? idea.parentId : undefined,
            kind: normalizeIdeaKind(idea.kind),
            done: !!idea.done,
            collapsed: !!idea.collapsed,
          },
        ];
      })
    : [];

  const ids = new Set(ideas.map((idea) => idea.id));
  let normalizedIdeas: Idea[] = ideas.map((idea) =>
    idea.parentId && !ids.has(idea.parentId) ? { ...idea, parentId: undefined } : idea,
  );

  if (schemaVersion < 4) {
    const rootId = uniqueId("root", seen);
    normalizedIdeas = [
      {
        id: rootId,
        text: title || EMPTY.title,
        cx: 0,
        cy: 0,
        parentId: undefined,
        kind: undefined,
        done: false,
        collapsed: false,
      },
      ...normalizedIdeas.map((idea) => ({
        ...idea,
        parentId: idea.parentId ?? rootId,
      })),
    ];
  } else if (normalizedIdeas.length === 0) {
    normalizedIdeas = EMPTY.ideas.map((idea) => ({
      ...idea,
      text: title || idea.text,
      cx: idea.cx,
      cy: idea.cy,
    }));
  }

  return {
    version: 4,
    title,
    ideas: normalizedIdeas,
    shape: normalizeShape(parsed.shape),
  };
}

export function normalizeBrainstormDoc(raw: unknown, fallbackIndex: number): BrainstormDoc {
  const parsed = (raw ?? {}) as Partial<BrainstormDoc>;
  const state = normalizeBrainstormState(parsed);
  return {
    ...state,
    id: typeof parsed.id === "string" && parsed.id ? parsed.id : `brainstorm-${fallbackIndex}`,
    updatedAt: isFiniteNumber(parsed.updatedAt) ? parsed.updatedAt : Date.now(),
  };
}

export function normalizeBrainstormLibrary(raw: unknown): BrainstormLibrary {
  const parsed = (raw ?? {}) as Partial<BrainstormLibrary>;
  const brainstorms = Array.isArray(parsed.brainstorms)
    ? parsed.brainstorms.map(normalizeBrainstormDoc)
    : [];

  if (brainstorms.length === 0) {
    const doc = createBrainstormDoc();
    return { version: 4, activeId: doc.id, brainstorms: [doc] };
  }

  const activeId =
    typeof parsed.activeId === "string" && brainstorms.some((doc) => doc.id === parsed.activeId)
      ? parsed.activeId
      : brainstorms[0].id;

  return { version: 4, activeId, brainstorms };
}

export function loadBrainstormLibrary(): BrainstormLibrary {
  if (typeof window === "undefined") return EMPTY_LIBRARY;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeBrainstormLibrary(JSON.parse(raw));
  } catch {
    /* ignore */
  }

  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const doc = createBrainstormDoc(normalizeBrainstormState(JSON.parse(legacy)));
      return { version: 4, activeId: doc.id, brainstorms: [doc] };
    }
  } catch {
    /* ignore */
  }

  const doc = createBrainstormDoc();
  return { version: 4, activeId: doc.id, brainstorms: [doc] };
}

export function saveBrainstormLibrary(library: BrainstormLibrary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...library, version: 4 }));
  } catch {
    /* ignore */
  }
}

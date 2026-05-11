import type { BrainstormState, Idea } from "./types";

export type BrainstormHistory = {
  past: BrainstormState[];
  future: BrainstormState[];
};

export const EMPTY_BRAINSTORM_HISTORY: BrainstormHistory = {
  past: [],
  future: [],
};

const HISTORY_LIMIT = 80;

function cloneIdea(idea: Idea): Idea {
  return {
    id: idea.id,
    text: idea.text,
    cx: idea.cx,
    cy: idea.cy,
    parentId: idea.parentId,
    kind: idea.kind,
    done: idea.done,
    collapsed: idea.collapsed,
  };
}

export function snapshotBrainstormState(state: BrainstormState): BrainstormState {
  return {
    version: 3,
    title: state.title,
    shape: state.shape,
    ideas: state.ideas.map(cloneIdea),
  };
}

export function areBrainstormStatesEqual(a: BrainstormState, b: BrainstormState) {
  if (a.title !== b.title || a.shape !== b.shape || a.ideas.length !== b.ideas.length) {
    return false;
  }

  return a.ideas.every((idea, index) => {
    const other = b.ideas[index];
    return (
      idea.id === other.id &&
      idea.text === other.text &&
      idea.cx === other.cx &&
      idea.cy === other.cy &&
      idea.parentId === other.parentId &&
      idea.kind === other.kind &&
      idea.done === other.done &&
      idea.collapsed === other.collapsed
    );
  });
}

export function recordBrainstormHistory(
  history: BrainstormHistory,
  current: BrainstormState,
  next: BrainstormState,
): BrainstormHistory {
  if (areBrainstormStatesEqual(current, next)) return history;

  return {
    past: [...history.past.slice(-(HISTORY_LIMIT - 1)), snapshotBrainstormState(current)],
    future: [],
  };
}

export function undoBrainstormHistory(
  history: BrainstormHistory,
  current: BrainstormState,
): { history: BrainstormHistory; state: BrainstormState | null } {
  const previous = history.past.at(-1);
  if (!previous) return { history, state: null };

  return {
    history: {
      past: history.past.slice(0, -1),
      future: [snapshotBrainstormState(current), ...history.future],
    },
    state: snapshotBrainstormState(previous),
  };
}

export function redoBrainstormHistory(
  history: BrainstormHistory,
  current: BrainstormState,
): { history: BrainstormHistory; state: BrainstormState | null } {
  const next = history.future[0];
  if (!next) return { history, state: null };

  return {
    history: {
      past: [...history.past, snapshotBrainstormState(current)].slice(-HISTORY_LIMIT),
      future: history.future.slice(1),
    },
    state: snapshotBrainstormState(next),
  };
}

import { clamp } from "./math";
import type { Idea } from "./types";

export function depthLevel(depth: number) {
  return clamp(depth, 0, 4);
}

export function ideaFontSize(depth: number) {
  return Math.max(12, 14 - depthLevel(depth) * 1.05);
}

export function computeDepthMap(ideas: Idea[]) {
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

export function getDefaultFocusedIdeaId(ideas: Idea[]) {
  return ideas.find((idea) => !idea.parentId)?.id ?? null;
}

export function getFocusedIdeaIdAfterAdd(parentId: string | undefined, addedId: string) {
  return parentId ?? addedId;
}

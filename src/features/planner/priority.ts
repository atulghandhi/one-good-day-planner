import type { Priority, TaskItem } from "./types";

export const PRIORITIES: Array<Priority | undefined> = [undefined, "high", "medium", "low"];

export const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const PRIORITY_META: Record<Priority, { label: string; className: string }> = {
  high: {
    label: "High priority",
    className: "bg-red-500 text-white shadow-[0_0_0_3px_rgba(239,68,68,0.18)]",
  },
  medium: {
    label: "Medium priority",
    className: "bg-amber-400 text-amber-950 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]",
  },
  low: {
    label: "Low priority",
    className: "bg-emerald-500 text-white shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
  },
};

export function orderTaskItems(items: TaskItem[]) {
  return items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => {
      if (a.item.done !== b.item.done) return a.item.done ? 1 : -1;
      if (!a.item.done) {
        const aRank = a.item.priority ? PRIORITY_RANK[a.item.priority] : 3;
        const bRank = b.item.priority ? PRIORITY_RANK[b.item.priority] : 3;
        if (aRank !== bRank) return aRank - bRank;
      }
      return a.originalIndex - b.originalIndex;
    });
}

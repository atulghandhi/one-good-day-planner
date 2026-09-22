import type { PlannerState, TaskItem } from "./types";
import { htmlToPlainText } from "./text";

export const JOT_STORAGE_KEY = "one-good-day:jot-list:v1";
export const PLANNER_MODE_KEY = "one-good-day:planner-mode:v1";

export type PlannerMode = "structured" | "jot";

export function normalizeJotItems(raw: unknown): TaskItem[] {
  if (!Array.isArray(raw)) return [{ text: "", done: false }];
  const items = raw.map((value) => {
    if (typeof value === "string") return { text: value, done: false };
    if (!value || typeof value !== "object") return { text: "", done: false };
    const item = value as Partial<TaskItem>;
    return {
      text: typeof item.text === "string" ? item.text : "",
      done: !!item.done,
    };
  });
  return items.length > 0 ? items : [{ text: "", done: false }];
}

/** Copies the meaningful parts of a structured plan without modifying its state. */
export function copyPlannerItemsToJot(state: PlannerState): TaskItem[] {
  const mit = htmlToPlainText(state.mit);
  const items: TaskItem[] = [];
  if (mit) items.push({ text: mit, done: state.mitDone });
  for (const item of [...state.shoulds, ...state.coulds]) {
    if (item.text.trim()) items.push({ ...item, steps: item.steps?.map((step) => ({ ...step })) });
  }
  return items.length > 0 ? items : [{ text: "", done: false }];
}

export function loadJotItems(): TaskItem[] {
  if (typeof window === "undefined") return [{ text: "", done: false }];
  try {
    const raw = window.localStorage.getItem(JOT_STORAGE_KEY);
    return raw ? normalizeJotItems(JSON.parse(raw)) : [{ text: "", done: false }];
  } catch {
    return [{ text: "", done: false }];
  }
}

export function saveJotItems(items: TaskItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(JOT_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* Browser storage can be unavailable in private modes. */
  }
}

export function loadPlannerMode(): PlannerMode {
  if (typeof window === "undefined") return "structured";
  try {
    return window.localStorage.getItem(PLANNER_MODE_KEY) === "jot" ? "jot" : "structured";
  } catch {
    return "structured";
  }
}

export function savePlannerMode(mode: PlannerMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLANNER_MODE_KEY, mode);
  } catch {
    /* Browser storage can be unavailable in private modes. */
  }
}

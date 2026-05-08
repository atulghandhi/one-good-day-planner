import { stripHtml, toMitHtml } from "./plannerImport";
import type { Idea } from "./types";
import type { PlannerState, TaskItem } from "@/features/planner/types";

export type PlannerTarget = "mit" | "should" | "could";

export type PlannerBridgeResult =
  | { status: "sent"; planner: PlannerState }
  | { status: "duplicate" }
  | { status: "needs-mit-confirmation"; existingMitText: string };

export function taskTextKey(text: string) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export function cleanTaskList(items: TaskItem[]) {
  return items.filter((item) => item.text.trim() || item.done);
}

export function hasTaskText(items: TaskItem[], text: string) {
  const key = taskTextKey(text);
  return key.length > 0 && items.some((item) => taskTextKey(item.text) === key);
}

export function childIdeasToTaskItems(children: Idea[]): TaskItem[] {
  return children
    .filter((idea) => idea.text.trim())
    .map((idea) => ({ text: idea.text, done: !!idea.done }));
}

export function createPlannerSendUpdate({
  planner,
  idea,
  childItems,
  target,
  confirmMitOverwrite = false,
}: {
  planner: PlannerState;
  idea: Idea;
  childItems: TaskItem[];
  target: PlannerTarget;
  confirmMitOverwrite?: boolean;
}): PlannerBridgeResult {
  if (target === "mit") {
    const existingMitText = stripHtml(planner.mit);
    if (existingMitText && !confirmMitOverwrite) {
      return { status: "needs-mit-confirmation", existingMitText };
    }

    return {
      status: "sent",
      planner: {
        ...planner,
        mit: toMitHtml(idea.text),
        mitDone: !!idea.done,
        mitSubs: childItems.length > 0 ? childItems : planner.mitSubs,
      },
    };
  }

  const key = target === "should" ? "shoulds" : "coulds";
  if (hasTaskText(planner[key], idea.text)) {
    return { status: "duplicate" };
  }

  return {
    status: "sent",
    planner: {
      ...planner,
      [key]: [...cleanTaskList(planner[key]), { text: idea.text, done: !!idea.done }],
    },
  };
}

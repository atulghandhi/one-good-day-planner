import { makeId } from "./storage";
import type { BrainstormState, Idea, IdeaKind } from "./types";
import type { PlannerState } from "@/features/planner/types";

export function stripHtml(value: string) {
  if (!value) return "";
  if (typeof document !== "undefined") {
    const element = document.createElement("div");
    element.innerHTML = value;
    return (element.textContent ?? "").trim();
  }
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toMitHtml(text: string) {
  return `<p>${escapeHtml(text)}</p>`;
}

export function buildTodayBrainstorm(planner: PlannerState): BrainstormState {
  const ideas: Idea[] = [];
  const addNode = (text: string, parentId?: string, kind: IdeaKind = "idea") => {
    const trimmed = text.trim();
    if (!trimmed) return undefined;
    const idea: Idea = {
      id: makeId("idea"),
      text: trimmed,
      parentId,
      kind,
    };
    ideas.push(idea);
    return idea.id;
  };

  const rootId = addNode("Today");
  const mitId = addNode("MIT", rootId, "task");
  const mitText = stripHtml(planner.mit);
  if (mitId && mitText) addNode(mitText, mitId, "task");
  planner.mitSubs.forEach((step) => {
    if (mitId && step.text.trim()) {
      addNode(step.text, mitId, "task");
    }
  });

  const shouldId = addNode("Shoulds", rootId, "note");
  planner.shoulds.forEach((item) => {
    if (shouldId && item.text.trim()) addNode(item.text, shouldId, "task");
  });

  const couldId = addNode("Coulds", rootId, "note");
  planner.coulds.forEach((item) => {
    if (couldId && item.text.trim()) addNode(item.text, couldId, "task");
  });

  return {
    version: 4,
    title: "Today",
    shape: "blob",
    ideas,
  };
}

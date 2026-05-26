import type { Idea, IdeaKind } from "./types";

export const IDEA_KIND_OPTIONS: IdeaKind[] = ["idea", "task", "note", "action"];

export function effectiveIdeaKind(idea: Pick<Idea, "kind">): IdeaKind {
  return idea.kind ?? "idea";
}

export function ideaKindLabel(kind: IdeaKind) {
  return kind === "idea" ? "Idea" : kind === "task" ? "Task" : kind === "note" ? "Note" : "Action";
}

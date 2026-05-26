import { htmlToPlainText, plainTextToMitHtml, taskHasText } from "./text";
import type { PlannerState, RolloverTask, TaskItem } from "./types";

const MAX_ROLLOVER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function dateMs(date: string) {
  return new Date(`${date}T12:00:00`).getTime();
}

function makeRolloverId(date: string, kind: RolloverTask["kind"], index: number, text: string) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
  return `${date}-${kind}-${index}-${slug || "task"}`;
}

function cloneSteps(steps?: TaskItem[]) {
  return (steps ?? [])
    .filter((step) => taskHasText(step.text))
    .map((step) => {
      const nested = cloneSteps(step.steps);
      const rest: TaskItem = { text: step.text, done: step.done, priority: step.priority };
      if (nested.length > 0) rest.steps = nested;
      return rest;
    });
}

function undoneSteps(steps?: TaskItem[]) {
  return cloneSteps(steps).filter((step) => !step.done);
}

export function pruneRolloverQueue(queue: RolloverTask[], today: string) {
  const cutoff = dateMs(today) - (MAX_ROLLOVER_DAYS - 1) * DAY_MS;
  const seen = new Set<string>();

  return queue
    .filter((task) => dateMs(task.date) >= cutoff)
    .sort((a, b) => {
      const dayDiff = dateMs(b.date) - dateMs(a.date);
      if (dayDiff !== 0) return dayDiff;
      return a.createdAt - b.createdAt;
    })
    .filter((task) => {
      if (seen.has(task.id)) return false;
      seen.add(task.id);
      return true;
    });
}

export function collectRolloverTasks(
  state: PlannerState,
  date: string,
  createdAt = Date.now(),
): RolloverTask[] {
  const tasks: RolloverTask[] = [];
  const mitText = htmlToPlainText(state.mit);

  if (taskHasText(mitText) && !state.mitDone) {
    tasks.push({
      id: makeRolloverId(date, "mit", 0, mitText),
      date,
      kind: "mit",
      text: mitText,
      mitHtml: state.mit,
      steps: undoneSteps(state.mitSubs),
      createdAt,
    });
  }

  state.shoulds.forEach((item, index) => {
    if (!taskHasText(item.text) || item.done) return;
    tasks.push({
      id: makeRolloverId(date, "should", index, item.text),
      date,
      kind: "should",
      text: item.text,
      steps: cloneSteps(item.steps),
      priority: item.priority,
      createdAt: createdAt + tasks.length,
    });
  });

  state.coulds.forEach((item, index) => {
    if (!taskHasText(item.text) || item.done) return;
    tasks.push({
      id: makeRolloverId(date, "could", index, item.text),
      date,
      kind: "could",
      text: item.text,
      steps: cloneSteps(item.steps),
      priority: item.priority,
      createdAt: createdAt + tasks.length,
    });
  });

  return tasks;
}

function addTaskToList(items: TaskItem[], item: TaskItem) {
  const nextItem = { ...item, steps: cloneSteps(item.steps) };
  const firstEmpty = items.findIndex((task) => !taskHasText(task.text));
  if (firstEmpty >= 0) {
    return items.map((task, index) => (index === firstEmpty ? nextItem : task));
  }
  return [nextItem, ...items];
}

function mitToShouldTask(state: PlannerState): TaskItem | null {
  const mitText = htmlToPlainText(state.mit);
  if (!taskHasText(mitText)) return null;

  const stepLines = state.mitSubs
    .filter((step) => taskHasText(step.text))
    .map((step) => `- ${step.text.trim()}`);

  return {
    text: [mitText, ...stepLines].join("\n"),
    done: false,
  };
}

export function insertRolloverTask(state: PlannerState, task: RolloverTask): PlannerState {
  if (task.kind === "mit") {
    const previousMitAsShould = mitToShouldTask(state);
    const mitHtml = task.mitHtml || plainTextToMitHtml(task.text);
    return {
      ...state,
      mit: mitHtml,
      mitDone: false,
      mitSubs: task.steps.length > 0 ? cloneSteps(task.steps) : [{ text: "", done: false }],
      shoulds: previousMitAsShould
        ? addTaskToList(state.shoulds, previousMitAsShould)
        : state.shoulds,
    };
  }

  const item: TaskItem = {
    text: task.text,
    done: false,
    priority: task.priority,
    steps: cloneSteps(task.steps),
  };

  if (task.kind === "should") {
    return { ...state, shoulds: addTaskToList(state.shoulds, item) };
  }

  return { ...state, coulds: addTaskToList(state.coulds, item) };
}

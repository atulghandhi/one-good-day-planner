export type Priority = "high" | "medium" | "low";

export type TaskItem = { text: string; done: boolean; priority?: Priority };

export type PlannerState = {
  mit: string;
  mitDone: boolean;
  mitSubs: TaskItem[];
  shoulds: TaskItem[];
  coulds: TaskItem[];
};

// Snapshot of a completed day, keyed by ISO date (YYYY-MM-DD, local).
export type DaySnapshot = PlannerState & { date: string };

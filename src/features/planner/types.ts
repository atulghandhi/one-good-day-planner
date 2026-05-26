export type Priority = "high" | "medium" | "low";

export type TaskItem = {
  text: string;
  done: boolean;
  priority?: Priority;
  steps?: TaskItem[];
};

export type PlannerState = {
  mit: string;
  mitDone: boolean;
  mitSubs: TaskItem[];
  shoulds: TaskItem[];
  coulds: TaskItem[];
};

// Snapshot of a completed day, keyed by ISO date (YYYY-MM-DD, local).
export type DaySnapshot = PlannerState & { date: string };

export type RolloverTaskKind = "mit" | "should" | "could";

export type RolloverTask = {
  id: string;
  date: string;
  kind: RolloverTaskKind;
  text: string;
  mitHtml?: string;
  steps: TaskItem[];
  priority?: Priority;
  createdAt: number;
};

export type Reflection = {
  /** ISO local date YYYY-MM-DD. */
  date: string;
  /** Free-text reflection. */
  text: string;
  /** Did the MIT happen? Mirrors mitDone at write time. */
  mitDone: boolean;
  /** A short label of what the MIT was, for context. */
  mitText?: string;
  /** Epoch ms. */
  createdAt: number;
};

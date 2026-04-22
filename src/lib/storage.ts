import { get, set, del } from "idb-keyval";

export type TaskItem = { text: string; done: boolean };

export type PlannerState = {
  mit: string;
  mitDone: boolean;
  mitSubs: TaskItem[];
  shoulds: TaskItem[];
  coulds: TaskItem[];
};

export const EMPTY_STATE: PlannerState = {
  mit: "",
  mitDone: false,
  mitSubs: [],
  shoulds: [{ text: "", done: false }],
  coulds: [{ text: "", done: false }],
};

const KEY = "one-good-day:v1";

// Migrate legacy shape (string[] -> TaskItem[]) and ensure shape is complete.
function normalize(raw: unknown): PlannerState {
  const r = (raw ?? {}) as Record<string, unknown>;
  const toItems = (v: unknown, allowEmpty = false): TaskItem[] => {
    if (!Array.isArray(v) || v.length === 0)
      return allowEmpty ? [] : [{ text: "", done: false }];
    return v.map((x) => {
      if (typeof x === "string") return { text: x, done: false };
      if (x && typeof x === "object") {
        const o = x as { text?: unknown; done?: unknown };
        return {
          text: typeof o.text === "string" ? o.text : "",
          done: !!o.done,
        };
      }
      return { text: "", done: false };
    });
  };
  return {
    mit: typeof r.mit === "string" ? r.mit : "",
    mitDone: !!r.mitDone,
    mitSubs: toItems(r.mitSubs, true),
    shoulds: toItems(r.shoulds),
    coulds: toItems(r.coulds),
  };
}

export async function loadState(): Promise<PlannerState> {
  if (typeof window !== "undefined") {
    try {
      const ls = window.localStorage.getItem(KEY);
      if (ls) return normalize(JSON.parse(ls));
    } catch {
      /* ignore */
    }
    try {
      const idb = await get<unknown>(KEY);
      if (idb) {
        const norm = normalize(idb);
        window.localStorage.setItem(KEY, JSON.stringify(norm));
        return norm;
      }
    } catch {
      /* ignore */
    }
  }
  return EMPTY_STATE;
}

export async function saveState(state: PlannerState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  try {
    await set(KEY, state);
  } catch {
    /* ignore */
  }
}

export async function clearState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  try {
    await del(KEY);
  } catch {
    /* ignore */
  }
}

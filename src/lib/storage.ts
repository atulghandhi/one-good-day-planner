import { get, set, del } from "idb-keyval";

export type PlannerState = {
  mit: string;
  mitSubs: string[];
  shoulds: string[];
  coulds: string[];
};

export const EMPTY_STATE: PlannerState = {
  mit: "",
  mitSubs: ["", "", ""],
  shoulds: [""],
  coulds: [""],
};

const KEY = "one-good-day:v1";

export async function loadState(): Promise<PlannerState> {
  // Try localStorage first (sync-feeling)
  if (typeof window !== "undefined") {
    try {
      const ls = window.localStorage.getItem(KEY);
      if (ls) return { ...EMPTY_STATE, ...JSON.parse(ls) };
    } catch {
      /* ignore */
    }
    try {
      const idb = await get<PlannerState>(KEY);
      if (idb) {
        window.localStorage.setItem(KEY, JSON.stringify(idb));
        return { ...EMPTY_STATE, ...idb };
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

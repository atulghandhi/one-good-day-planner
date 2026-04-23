import { get, set, del } from "idb-keyval";

export type TaskItem = { text: string; done: boolean };

export type PlannerState = {
  mit: string;
  mitDone: boolean;
  mitSubs: TaskItem[];
  shoulds: TaskItem[];
  coulds: TaskItem[];
};

// Snapshot of a completed day, keyed by ISO date (YYYY-MM-DD, local).
export type DaySnapshot = PlannerState & { date: string };

export const EMPTY_STATE: PlannerState = {
  mit: "",
  mitDone: false,
  mitSubs: [],
  shoulds: [{ text: "", done: false }],
  coulds: [{ text: "", done: false }],
};

const KEY = "one-good-day:v1";
const HISTORY_KEY = "one-good-day:history:v1";
const ACTIVE_DATE_KEY = "one-good-day:active-date";

// Local-date ISO string (YYYY-MM-DD) — avoids UTC drift around midnight.
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Monday of the week containing `d` (local).
export function startOfWeek(d: Date = new Date()): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = out.getDay(); // 0=Sun .. 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  out.setDate(out.getDate() + diff);
  return out;
}

export function weekDates(reference: Date = new Date()): Date[] {
  const start = startOfWeek(reference);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

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

function hasAnyContent(s: PlannerState): boolean {
  if (s.mit.trim().length > 0) return true;
  if (s.mitSubs.some((i) => i.text.trim().length > 0)) return true;
  if (s.shoulds.some((i) => i.text.trim().length > 0)) return true;
  if (s.coulds.some((i) => i.text.trim().length > 0)) return true;
  return false;
}

export async function loadHistory(): Promise<Record<string, DaySnapshot>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as Record<string, DaySnapshot>;
  } catch {
    /* ignore */
  }
  try {
    const v = await get<Record<string, DaySnapshot>>(HISTORY_KEY);
    if (v) return v;
  } catch {
    /* ignore */
  }
  return {};
}

async function writeHistory(h: Record<string, DaySnapshot>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  } catch {
    /* ignore */
  }
  try {
    await set(HISTORY_KEY, h);
  } catch {
    /* ignore */
  }
}

// Prune history to only the current Mon-Sun week.
function pruneToCurrentWeek(
  h: Record<string, DaySnapshot>,
): Record<string, DaySnapshot> {
  const week = weekDates().map(isoDate);
  const out: Record<string, DaySnapshot> = {};
  for (const k of week) {
    if (h[k]) out[k] = h[k];
  }
  return out;
}

// Roll over the day if needed:
// - If active date changed, archive the previous active state into history.
// - If we crossed into a new week (Monday), reset history (fresh week).
async function rollover(state: PlannerState): Promise<{
  state: PlannerState;
  history: Record<string, DaySnapshot>;
}> {
  const today = isoDate();
  let activeDate: string | null = null;
  try {
    activeDate = window.localStorage.getItem(ACTIVE_DATE_KEY);
  } catch {
    /* ignore */
  }
  let history = await loadHistory();

  if (!activeDate) {
    // First run for this device — set active date, prune history to this week.
    history = pruneToCurrentWeek(history);
    await writeHistory(history);
    try {
      window.localStorage.setItem(ACTIVE_DATE_KEY, today);
    } catch {
      /* ignore */
    }
    return { state, history };
  }

  if (activeDate === today) {
    // Same day — ensure history is in current week (handles week rollover edge).
    const weekKeys = weekDates().map(isoDate);
    if (!weekKeys.includes(activeDate)) {
      history = {};
      await writeHistory(history);
    }
    return { state, history };
  }

  // Day changed. Archive previous day's state if it had any content.
  if (hasAnyContent(state)) {
    history[activeDate] = { ...state, date: activeDate };
  }

  // Did we cross into a new week? If today's week start > activeDate's week start, fresh.
  const prevWeekStart = isoDate(startOfWeek(new Date(activeDate + "T12:00:00")));
  const curWeekStart = isoDate(startOfWeek(new Date(today + "T12:00:00")));
  if (prevWeekStart !== curWeekStart) {
    history = {};
  } else {
    history = pruneToCurrentWeek(history);
  }
  await writeHistory(history);

  try {
    window.localStorage.setItem(ACTIVE_DATE_KEY, today);
  } catch {
    /* ignore */
  }

  // Fresh state for new day.
  return { state: EMPTY_STATE, history };
}

export async function loadState(): Promise<PlannerState> {
  if (typeof window !== "undefined") {
    let raw: PlannerState = EMPTY_STATE;
    try {
      const ls = window.localStorage.getItem(KEY);
      if (ls) raw = normalize(JSON.parse(ls));
    } catch {
      /* ignore */
    }
    if (raw === EMPTY_STATE) {
      try {
        const idb = await get<unknown>(KEY);
        if (idb) {
          raw = normalize(idb);
          window.localStorage.setItem(KEY, JSON.stringify(raw));
        }
      } catch {
        /* ignore */
      }
    }
    const { state } = await rollover(raw);
    if (state !== raw) {
      // Persist the fresh state immediately.
      await saveState(state);
    }
    return state;
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
  // Also keep a live snapshot of today in history so the week view shows it.
  try {
    const today = isoDate();
    const h = await loadHistory();
    if (hasAnyContent(state)) {
      h[today] = { ...state, date: today };
    } else {
      delete h[today];
    }
    await writeHistory(pruneToCurrentWeek(h));
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
  // Also remove today from history on explicit reset.
  try {
    const today = isoDate();
    const h = await loadHistory();
    delete h[today];
    await writeHistory(h);
  } catch {
    /* ignore */
  }
}

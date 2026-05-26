import { get, set, del } from "idb-keyval";
import { collectRolloverTasks, pruneRolloverQueue } from "./rollover";
import { taskHasText } from "./text";
import type { DaySnapshot, PlannerState, Priority, RolloverTask, TaskItem } from "./types";

export const EMPTY_STATE: PlannerState = {
  mit: "",
  mitDone: false,
  mitSubs: [],
  shoulds: [{ text: "", done: false }],
  coulds: [{ text: "", done: false }],
};

export const PLANNER_STORAGE_KEY = "one-good-day:v1";
export const PLANNER_HISTORY_KEY = "one-good-day:history:v1";
export const ACTIVE_DATE_KEY = "one-good-day:active-date";
export const PLANNER_ROLLOVER_KEY = "one-good-day:rollover:v1";

// Local-date ISO string (YYYY-MM-DD) avoids UTC drift around midnight.
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

export function normalizePlannerState(raw: unknown): PlannerState {
  const r = (raw ?? {}) as Record<string, unknown>;
  const toPriority = (v: unknown): Priority | undefined =>
    v === "high" || v === "medium" || v === "low" ? v : undefined;
  const toItems = (v: unknown, allowEmpty = false): TaskItem[] => {
    if (!Array.isArray(v) || v.length === 0) return allowEmpty ? [] : [{ text: "", done: false }];
    return v.map((x) => {
      if (typeof x === "string") return { text: x, done: false };
      if (x && typeof x === "object") {
        const o = x as { text?: unknown; done?: unknown; priority?: unknown; steps?: unknown };
        const item: TaskItem = {
          text: typeof o.text === "string" ? o.text : "",
          done: !!o.done,
          priority: toPriority(o.priority),
        };
        const steps = toItems(o.steps, true).filter((step) => taskHasText(step.text));
        if (steps.length > 0) item.steps = steps;
        return item;
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

function normalizeRolloverTask(raw: unknown): RolloverTask | null {
  const r = (raw ?? {}) as Partial<RolloverTask>;
  const kind = r.kind === "mit" || r.kind === "should" || r.kind === "could" ? r.kind : null;
  const text = typeof r.text === "string" ? r.text : "";
  const date = typeof r.date === "string" ? r.date : "";
  if (!kind || !date || !taskHasText(text)) return null;

  const normalizedSteps = normalizePlannerState({ shoulds: r.steps ?? [] }).shoulds.filter((step) =>
    taskHasText(step.text),
  );

  return {
    id:
      typeof r.id === "string" && r.id
        ? r.id
        : `${date}-${kind}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    date,
    kind,
    text,
    mitHtml: typeof r.mitHtml === "string" ? r.mitHtml : undefined,
    steps: normalizedSteps,
    priority:
      r.priority === "high" || r.priority === "medium" || r.priority === "low"
        ? r.priority
        : undefined,
    createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
  };
}

function normalizeRolloverQueue(raw: unknown, today = isoDate()): RolloverTask[] {
  if (!Array.isArray(raw)) return [];
  return pruneRolloverQueue(
    raw.flatMap((item) => {
      const normalized = normalizeRolloverTask(item);
      return normalized ? [normalized] : [];
    }),
    today,
  );
}

function offsetIsoDate(base: string, offsetDays: number) {
  const date = new Date(`${base}T12:00:00`);
  date.setDate(date.getDate() + offsetDays);
  return isoDate(date);
}

function sampleRolloverQueue(today = isoDate()): RolloverTask[] {
  const yesterday = offsetIsoDate(today, -1);
  const dayBefore = offsetIsoDate(today, -2);
  const createdAt = new Date(`${dayBefore}T09:00:00`).getTime();

  return [
    {
      id: `${yesterday}-mit-demo-proposal`,
      date: yesterday,
      kind: "mit",
      text: "Send revised proposal",
      mitHtml: "<p>Send revised proposal</p>",
      steps: [
        { text: "Pull latest numbers", done: false },
        { text: "Draft short summary", done: false },
      ],
      createdAt: createdAt + 10,
    },
    {
      id: `${yesterday}-should-demo-dentist`,
      date: yesterday,
      kind: "should",
      text: "Book dentist appointment",
      steps: [],
      priority: "medium",
      createdAt: createdAt + 11,
    },
    {
      id: `${yesterday}-could-demo-downloads`,
      date: yesterday,
      kind: "could",
      text: "Sort downloads folder",
      steps: [],
      priority: "low",
      createdAt: createdAt + 12,
    },
    {
      id: `${dayBefore}-should-demo-invoice`,
      date: dayBefore,
      kind: "should",
      text: "Chase invoice with Sam",
      steps: [],
      priority: "high",
      createdAt: createdAt + 1,
    },
    {
      id: `${dayBefore}-could-demo-article`,
      date: dayBefore,
      kind: "could",
      text: "Read saved article",
      steps: [],
      createdAt: createdAt + 2,
    },
  ];
}

function consumeRolloverDemoFlag() {
  if (typeof window === "undefined" || !import.meta.env.DEV) return false;
  const url = new URL(window.location.href);
  const shouldSeed =
    url.searchParams.get("rolloverDemo") === "1" || url.searchParams.get("seedRollover") === "1";
  if (!shouldSeed) return false;

  url.searchParams.delete("rolloverDemo");
  url.searchParams.delete("seedRollover");
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, "", nextUrl || "/");
  return true;
}

export function hasPlannerContent(s: PlannerState): boolean {
  if (s.mit.trim().length > 0) return true;
  if (s.mitSubs.some((i) => i.text.trim().length > 0)) return true;
  if (s.shoulds.some((i) => i.text.trim().length > 0)) return true;
  if (s.coulds.some((i) => i.text.trim().length > 0)) return true;
  return false;
}

export async function loadHistory(): Promise<Record<string, DaySnapshot>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PLANNER_HISTORY_KEY);
    if (raw) return JSON.parse(raw) as Record<string, DaySnapshot>;
  } catch {
    /* ignore */
  }
  try {
    const v = await get<Record<string, DaySnapshot>>(PLANNER_HISTORY_KEY);
    if (v) return v;
  } catch {
    /* ignore */
  }
  return {};
}

async function writeHistory(h: Record<string, DaySnapshot>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLANNER_HISTORY_KEY, JSON.stringify(h));
  } catch {
    /* ignore */
  }
  try {
    await set(PLANNER_HISTORY_KEY, h);
  } catch {
    /* ignore */
  }
}

async function readRolloverQueueRaw(): Promise<unknown> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PLANNER_ROLLOVER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  try {
    const v = await get<unknown>(PLANNER_ROLLOVER_KEY);
    if (v) return v;
  } catch {
    /* ignore */
  }
  return [];
}

export async function loadRolloverQueue(): Promise<RolloverTask[]> {
  const today = isoDate();
  const queue = normalizeRolloverQueue(await readRolloverQueueRaw(), today);
  if (consumeRolloverDemoFlag()) {
    const seeded = normalizeRolloverQueue([...sampleRolloverQueue(today), ...queue], today);
    await saveRolloverQueue(seeded);
    return seeded;
  }
  await saveRolloverQueue(queue);
  return queue;
}

export async function saveRolloverQueue(queue: RolloverTask[]) {
  if (typeof window === "undefined") return;
  const normalized = normalizeRolloverQueue(queue);
  try {
    window.localStorage.setItem(PLANNER_ROLLOVER_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore */
  }
  try {
    await set(PLANNER_ROLLOVER_KEY, normalized);
  } catch {
    /* ignore */
  }
}

export async function clearRolloverQueue() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PLANNER_ROLLOVER_KEY);
  } catch {
    /* ignore */
  }
  try {
    await del(PLANNER_ROLLOVER_KEY);
  } catch {
    /* ignore */
  }
}

export function pruneToCurrentWeek(h: Record<string, DaySnapshot>): Record<string, DaySnapshot> {
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
    const weekKeys = weekDates().map(isoDate);
    if (!weekKeys.includes(activeDate)) {
      history = {};
      await writeHistory(history);
    }
    return { state, history };
  }

  if (hasPlannerContent(state)) {
    history[activeDate] = { ...state, date: activeDate };
  }

  const unfinished = collectRolloverTasks(state, activeDate);
  if (unfinished.length > 0) {
    const currentQueue = normalizeRolloverQueue(await readRolloverQueueRaw(), today);
    await saveRolloverQueue([...unfinished, ...currentQueue]);
  }

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

  return { state: EMPTY_STATE, history };
}

export async function loadState(): Promise<PlannerState> {
  if (typeof window !== "undefined") {
    let raw: PlannerState = EMPTY_STATE;
    try {
      const ls = window.localStorage.getItem(PLANNER_STORAGE_KEY);
      if (ls) raw = normalizePlannerState(JSON.parse(ls));
    } catch {
      /* ignore */
    }
    if (raw === EMPTY_STATE) {
      try {
        const idb = await get<unknown>(PLANNER_STORAGE_KEY);
        if (idb) {
          raw = normalizePlannerState(idb);
          window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(raw));
        }
      } catch {
        /* ignore */
      }
    }
    const { state } = await rollover(raw);
    if (state !== raw) {
      await saveState(state);
    }
    return state;
  }
  return EMPTY_STATE;
}

export async function saveState(state: PlannerState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  try {
    await set(PLANNER_STORAGE_KEY, state);
  } catch {
    /* ignore */
  }
  // Also keep a live snapshot of today in history so the week view shows it.
  try {
    const today = isoDate();
    const h = await loadHistory();
    if (hasPlannerContent(state)) {
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
    window.localStorage.removeItem(PLANNER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    await del(PLANNER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  await clearRolloverQueue();
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

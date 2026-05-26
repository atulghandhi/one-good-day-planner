import { get, set } from "idb-keyval";
import type { Reflection } from "./types";

const REFLECTIONS_KEY = "one-good-day:reflections:v1";

export async function loadReflections(): Promise<Record<string, Reflection>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REFLECTIONS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, Reflection>;
  } catch {
    /* ignore */
  }
  try {
    const v = await get<Record<string, Reflection>>(REFLECTIONS_KEY);
    if (v) return v;
  } catch {
    /* ignore */
  }
  return {};
}

export async function saveReflection(r: Reflection): Promise<Record<string, Reflection>> {
  if (typeof window === "undefined") return {};
  const map = await loadReflections();
  map[r.date] = r;
  try {
    window.localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  try {
    await set(REFLECTIONS_KEY, map);
  } catch {
    /* ignore */
  }
  return map;
}

export async function deleteReflection(date: string): Promise<Record<string, Reflection>> {
  if (typeof window === "undefined") return {};
  const map = await loadReflections();
  delete map[date];
  try {
    window.localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  try {
    await set(REFLECTIONS_KEY, map);
  } catch {
    /* ignore */
  }
  return map;
}

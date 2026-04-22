// Theme presets — 3 light, 3 dark. Each defines core hue tokens used across the app.

export type ThemeKey =
  | "sakura"
  | "blossom"
  | "meadow"
  | "nebula"
  | "forest"
  | "starry";

export type ThemeTokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  mit: string;
  mitFg: string;
  should: string;
  shouldFg: string;
  could: string;
  couldFg: string;
  sun: string;
  sky: string;
  gradientSky: string;
  gradientMit: string;
  gradientShould: string;
  gradientCould: string;
};

/* ---------------- LIGHT THEMES ---------------- */

// Sakura — Japan inspired: soft pinks, washi cream, indigo ink, matcha
const sakura: ThemeTokens = {
  background: "oklch(0.98 0.015 35)",
  foreground: "oklch(0.24 0.05 280)",
  card: "oklch(0.995 0.005 60)",
  cardForeground: "oklch(0.24 0.05 280)",
  muted: "oklch(0.95 0.02 30)",
  mutedForeground: "oklch(0.48 0.04 280)",
  border: "oklch(0.91 0.02 30)",
  mit: "oklch(0.82 0.11 10)",
  mitFg: "oklch(0.28 0.1 10)",
  should: "oklch(0.85 0.09 145)",
  shouldFg: "oklch(0.3 0.07 145)",
  could: "oklch(0.78 0.09 270)",
  couldFg: "oklch(0.28 0.1 270)",
  sun: "oklch(0.92 0.1 80)",
  sky: "oklch(0.9 0.06 220)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.97 0.03 30), oklch(0.94 0.05 350) 50%, oklch(0.95 0.04 140))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.88 0.1 15), oklch(0.82 0.12 350))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.88 0.09 145), oklch(0.86 0.1 125))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.82 0.09 275), oklch(0.8 0.1 250))",
};

// Blossom — playful pastel coral / mint / lavender (the original)
const blossom: ThemeTokens = {
  background: "oklch(0.985 0.02 95)",
  foreground: "oklch(0.22 0.04 285)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.22 0.04 285)",
  muted: "oklch(0.95 0.02 90)",
  mutedForeground: "oklch(0.5 0.03 285)",
  border: "oklch(0.92 0.02 90)",
  mit: "oklch(0.78 0.16 30)",
  mitFg: "oklch(0.25 0.1 25)",
  should: "oklch(0.85 0.13 165)",
  shouldFg: "oklch(0.28 0.08 165)",
  could: "oklch(0.83 0.13 270)",
  couldFg: "oklch(0.3 0.1 270)",
  sun: "oklch(0.9 0.15 90)",
  sky: "oklch(0.88 0.1 230)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.96 0.05 90), oklch(0.93 0.07 200) 50%, oklch(0.95 0.06 320))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.85 0.14 35), oklch(0.8 0.16 15))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.9 0.12 160), oklch(0.88 0.13 190))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.88 0.13 280), oklch(0.86 0.13 320))",
};

// Meadow — soft buttery yellow, sky blue, peach
const meadow: ThemeTokens = {
  background: "oklch(0.985 0.025 95)",
  foreground: "oklch(0.24 0.04 240)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.24 0.04 240)",
  muted: "oklch(0.95 0.02 95)",
  mutedForeground: "oklch(0.5 0.04 240)",
  border: "oklch(0.92 0.02 95)",
  mit: "oklch(0.86 0.13 85)",
  mitFg: "oklch(0.3 0.1 70)",
  should: "oklch(0.85 0.1 215)",
  shouldFg: "oklch(0.28 0.08 230)",
  could: "oklch(0.85 0.1 50)",
  couldFg: "oklch(0.3 0.09 40)",
  sun: "oklch(0.92 0.14 85)",
  sky: "oklch(0.88 0.09 215)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.96 0.06 85), oklch(0.93 0.07 200) 50%, oklch(0.95 0.05 50))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.9 0.13 90), oklch(0.86 0.14 70))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.88 0.1 220), oklch(0.86 0.11 200))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.88 0.1 55), oklch(0.85 0.11 35))",
};

/* ---------------- DARK THEMES ---------------- */

// Nebula — purple sci-fi, neon magenta + cyan
const nebula: ThemeTokens = {
  background: "oklch(0.17 0.04 295)",
  foreground: "oklch(0.97 0.01 300)",
  card: "oklch(0.23 0.05 295)",
  cardForeground: "oklch(0.97 0.01 300)",
  muted: "oklch(0.3 0.05 295)",
  mutedForeground: "oklch(0.78 0.03 295)",
  border: "oklch(1 0 0 / 12%)",
  mit: "oklch(0.72 0.2 320)",
  mitFg: "oklch(0.98 0.04 320)",
  should: "oklch(0.74 0.17 200)",
  shouldFg: "oklch(0.97 0.05 200)",
  could: "oklch(0.72 0.18 270)",
  couldFg: "oklch(0.97 0.05 270)",
  sun: "oklch(0.78 0.18 320)",
  sky: "oklch(0.7 0.16 250)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.2 0.07 290), oklch(0.18 0.09 320) 50%, oklch(0.2 0.08 260))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.65 0.21 320), oklch(0.6 0.22 295))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.66 0.18 205), oklch(0.62 0.19 230))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.65 0.19 275), oklch(0.6 0.2 300))",
};

// Forest — deep green forest, mossy & earthy
const forest: ThemeTokens = {
  background: "oklch(0.18 0.03 150)",
  foreground: "oklch(0.96 0.02 110)",
  card: "oklch(0.24 0.04 150)",
  cardForeground: "oklch(0.96 0.02 110)",
  muted: "oklch(0.3 0.04 150)",
  mutedForeground: "oklch(0.78 0.03 130)",
  border: "oklch(1 0 0 / 12%)",
  mit: "oklch(0.74 0.16 145)",
  mitFg: "oklch(0.97 0.05 145)",
  should: "oklch(0.78 0.14 95)",
  shouldFg: "oklch(0.97 0.05 95)",
  could: "oklch(0.74 0.13 60)",
  couldFg: "oklch(0.97 0.05 55)",
  sun: "oklch(0.55 0.08 150)",
  sky: "oklch(0.5 0.08 175)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.18 0.04 155), oklch(0.16 0.05 140) 50%, oklch(0.17 0.04 170))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.5 0.12 150), oklch(0.45 0.13 135))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.5 0.1 130), oklch(0.46 0.11 110))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.48 0.1 95), oklch(0.44 0.11 75))",
};

// Starry — midnight blue starry sky
const starry: ThemeTokens = {
  background: "oklch(0.16 0.05 265)",
  foreground: "oklch(0.97 0.02 250)",
  card: "oklch(0.22 0.06 265)",
  cardForeground: "oklch(0.97 0.02 250)",
  muted: "oklch(0.28 0.06 265)",
  mutedForeground: "oklch(0.78 0.04 250)",
  border: "oklch(1 0 0 / 12%)",
  mit: "oklch(0.74 0.16 245)",
  mitFg: "oklch(0.97 0.05 245)",
  should: "oklch(0.78 0.14 215)",
  shouldFg: "oklch(0.97 0.05 215)",
  could: "oklch(0.74 0.15 290)",
  couldFg: "oklch(0.97 0.05 290)",
  sun: "oklch(0.55 0.1 250)",
  sky: "oklch(0.5 0.12 240)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.16 0.06 265), oklch(0.14 0.08 280) 50%, oklch(0.17 0.07 240))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.42 0.15 270))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.5 0.12 220), oklch(0.45 0.13 235))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.48 0.13 285), oklch(0.42 0.14 305))",
};

export const THEMES: Record<
  ThemeKey,
  { name: string; tokens: ThemeTokens; mode: "light" | "dark" }
> = {
  sakura: { name: "Sakura", tokens: sakura, mode: "light" },
  blossom: { name: "Blossom", tokens: blossom, mode: "light" },
  meadow: { name: "Meadow", tokens: meadow, mode: "light" },
  nebula: { name: "Nebula", tokens: nebula, mode: "dark" },
  forest: { name: "Forest", tokens: forest, mode: "dark" },
  starry: { name: "Starry", tokens: starry, mode: "dark" },
};

// Order: lights first, then darks (top to bottom in dropdown)
export const THEME_ORDER: ThemeKey[] = [
  "sakura",
  "blossom",
  "meadow",
  "nebula",
  "forest",
  "starry",
];

const STORAGE_KEY = "one-good-day:theme";

export function applyTheme(key: ThemeKey) {
  const theme = THEMES[key];
  if (!theme || typeof document === "undefined") return;
  const t = theme.tokens;
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  set("--background", t.background);
  set("--foreground", t.foreground);
  set("--card", t.card);
  set("--card-foreground", t.cardForeground);
  set("--popover", t.card);
  set("--popover-foreground", t.cardForeground);
  set("--muted", t.muted);
  set("--muted-foreground", t.mutedForeground);
  set("--border", t.border);
  set("--mit", t.mit);
  set("--mit-foreground", t.mitFg);
  set("--should", t.should);
  set("--should-foreground", t.shouldFg);
  set("--could", t.could);
  set("--could-foreground", t.couldFg);
  set("--sun", t.sun);
  set("--sky", t.sky);
  set("--primary", t.mit);
  set("--ring", t.mit);
  set("--gradient-sky", t.gradientSky);
  set("--gradient-mit", t.gradientMit);
  set("--gradient-should", t.gradientShould);
  set("--gradient-could", t.gradientCould);

  // Toggle .dark class so any dark-mode utilities apply correctly
  if (theme.mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  // Tag the root with the theme key so CSS effects (stars, glitter) can target
  root.setAttribute("data-theme", key);

  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* ignore */
  }
}

export function loadSavedTheme(): ThemeKey {
  if (typeof window === "undefined") return "blossom";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && v in THEMES) return v as ThemeKey;
  } catch {
    /* ignore */
  }
  return "blossom";
}

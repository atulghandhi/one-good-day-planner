// Theme presets — each defines the 4 core hue tokens used across the app.
// Colors chosen for harmony + readable foreground contrast on light card.

export type ThemeKey =
  | "coral"
  | "ocean"
  | "forest"
  | "sunset"
  | "candy"
  | "midnight";

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

// Default — current playful pastel coral palette
const coral: ThemeTokens = {
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

// Cool ocean — teals & blues
const ocean: ThemeTokens = {
  background: "oklch(0.98 0.02 220)",
  foreground: "oklch(0.22 0.05 240)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.22 0.05 240)",
  muted: "oklch(0.95 0.02 220)",
  mutedForeground: "oklch(0.5 0.04 240)",
  border: "oklch(0.92 0.02 220)",
  mit: "oklch(0.75 0.14 220)",
  mitFg: "oklch(0.25 0.1 230)",
  should: "oklch(0.83 0.12 190)",
  shouldFg: "oklch(0.28 0.08 200)",
  could: "oklch(0.82 0.11 260)",
  couldFg: "oklch(0.3 0.1 260)",
  sun: "oklch(0.9 0.1 200)",
  sky: "oklch(0.88 0.09 240)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.95 0.05 200), oklch(0.92 0.07 230) 50%, oklch(0.94 0.05 260))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.82 0.13 215), oklch(0.78 0.15 235))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.88 0.12 185), oklch(0.86 0.12 205))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.87 0.11 255), oklch(0.85 0.12 280))",
};

// Forest — sage & earth
const forest: ThemeTokens = {
  background: "oklch(0.97 0.02 120)",
  foreground: "oklch(0.22 0.04 145)",
  card: "oklch(0.995 0.005 120)",
  cardForeground: "oklch(0.22 0.04 145)",
  muted: "oklch(0.94 0.02 120)",
  mutedForeground: "oklch(0.48 0.04 145)",
  border: "oklch(0.91 0.02 120)",
  mit: "oklch(0.72 0.14 145)",
  mitFg: "oklch(0.24 0.09 145)",
  should: "oklch(0.82 0.11 95)",
  shouldFg: "oklch(0.28 0.08 95)",
  could: "oklch(0.82 0.1 60)",
  couldFg: "oklch(0.3 0.09 50)",
  sun: "oklch(0.9 0.13 95)",
  sky: "oklch(0.88 0.08 165)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.95 0.05 130), oklch(0.93 0.06 100) 50%, oklch(0.95 0.05 70))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.8 0.13 150), oklch(0.75 0.15 135))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.87 0.11 100), oklch(0.85 0.12 85))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.86 0.1 65), oklch(0.84 0.11 45))",
};

// Sunset — warm oranges, magentas
const sunset: ThemeTokens = {
  background: "oklch(0.98 0.02 60)",
  foreground: "oklch(0.22 0.05 30)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.22 0.05 30)",
  muted: "oklch(0.95 0.02 60)",
  mutedForeground: "oklch(0.48 0.04 30)",
  border: "oklch(0.92 0.02 60)",
  mit: "oklch(0.75 0.17 50)",
  mitFg: "oklch(0.25 0.12 40)",
  should: "oklch(0.78 0.15 15)",
  shouldFg: "oklch(0.28 0.1 15)",
  could: "oklch(0.78 0.14 340)",
  couldFg: "oklch(0.3 0.1 340)",
  sun: "oklch(0.9 0.15 80)",
  sky: "oklch(0.85 0.11 350)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.95 0.06 70), oklch(0.92 0.08 30) 50%, oklch(0.93 0.07 350))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.82 0.16 60), oklch(0.78 0.17 35))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.83 0.14 25), oklch(0.8 0.15 5))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.83 0.13 350), oklch(0.8 0.14 320))",
};

// Candy — bubblegum pinks & lilacs
const candy: ThemeTokens = {
  background: "oklch(0.98 0.02 340)",
  foreground: "oklch(0.22 0.05 320)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.22 0.05 320)",
  muted: "oklch(0.95 0.02 340)",
  mutedForeground: "oklch(0.5 0.04 320)",
  border: "oklch(0.92 0.02 340)",
  mit: "oklch(0.78 0.15 350)",
  mitFg: "oklch(0.27 0.1 345)",
  should: "oklch(0.83 0.12 300)",
  shouldFg: "oklch(0.3 0.09 300)",
  could: "oklch(0.84 0.11 250)",
  couldFg: "oklch(0.3 0.1 255)",
  sun: "oklch(0.9 0.13 340)",
  sky: "oklch(0.88 0.1 280)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.95 0.06 340), oklch(0.93 0.07 300) 50%, oklch(0.94 0.06 260))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.85 0.14 355), oklch(0.81 0.16 335))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.87 0.12 305), oklch(0.85 0.13 285))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.87 0.11 260), oklch(0.85 0.12 240))",
};

// Midnight — dark mode with neon accents
const midnight: ThemeTokens = {
  background: "oklch(0.18 0.03 285)",
  foreground: "oklch(0.97 0.01 90)",
  card: "oklch(0.24 0.03 285)",
  cardForeground: "oklch(0.97 0.01 90)",
  muted: "oklch(0.3 0.04 285)",
  mutedForeground: "oklch(0.78 0.02 285)",
  border: "oklch(1 0 0 / 12%)",
  mit: "oklch(0.78 0.18 25)",
  mitFg: "oklch(0.97 0.04 30)",
  should: "oklch(0.78 0.16 165)",
  shouldFg: "oklch(0.96 0.05 165)",
  could: "oklch(0.78 0.16 280)",
  couldFg: "oklch(0.96 0.05 280)",
  sun: "oklch(0.78 0.18 90)",
  sky: "oklch(0.7 0.15 230)",
  gradientSky:
    "linear-gradient(135deg, oklch(0.22 0.06 280), oklch(0.2 0.07 250) 50%, oklch(0.22 0.06 320))",
  gradientMit:
    "linear-gradient(135deg, oklch(0.72 0.18 30), oklch(0.65 0.2 10))",
  gradientShould:
    "linear-gradient(135deg, oklch(0.7 0.16 160), oklch(0.68 0.17 190))",
  gradientCould:
    "linear-gradient(135deg, oklch(0.7 0.17 280), oklch(0.68 0.18 310))",
};

export const THEMES: Record<ThemeKey, { name: string; tokens: ThemeTokens }> = {
  coral: { name: "Coral", tokens: coral },
  ocean: { name: "Ocean", tokens: ocean },
  forest: { name: "Forest", tokens: forest },
  sunset: { name: "Sunset", tokens: sunset },
  candy: { name: "Candy", tokens: candy },
  midnight: { name: "Midnight", tokens: midnight },
};

export const THEME_ORDER: ThemeKey[] = [
  "coral",
  "ocean",
  "forest",
  "sunset",
  "candy",
  "midnight",
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

  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* ignore */
  }
}

export function loadSavedTheme(): ThemeKey {
  if (typeof window === "undefined") return "coral";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && v in THEMES) return v as ThemeKey;
  } catch {
    /* ignore */
  }
  return "coral";
}

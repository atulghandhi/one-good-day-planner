import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isoDate } from "@/features/planner/storage";

/**
 * Once-per-day choreographed entry. Renders nothing itself — exposes a stage value
 * (0 → 4) that consumer components animate against via `useIntroStage()`.
 *
 *   stage 0  before any animation has fired
 *   stage 1  blobs fade in
 *   stage 2  date pill + Brainstorm pill
 *   stage 3  title (mask-reveal) + subtitle
 *   stage 4  MIT card slides up; caret blinks
 *
 * If the user has already opened the app today, we skip the choreography and
 * jump straight to stage 4. Respects prefers-reduced-motion.
 */

type IntroContextValue = {
  stage: number;
  active: boolean;
};

const IntroContext = createContext<IntroContextValue>({ stage: 4, active: false });

export function useIntroStage() {
  return useContext(IntroContext);
}

const KEY = "ogd:introPlayed";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function IntroChoreographyProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState(4);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let playedToday = false;
    try {
      playedToday = window.localStorage.getItem(KEY) === isoDate();
    } catch {
      playedToday = false;
    }
    if (playedToday || prefersReducedMotion()) {
      setStage(4);
      setActive(false);
      return;
    }

    setActive(true);
    setStage(0);

    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStage(1), 80));
    timers.push(window.setTimeout(() => setStage(2), 320));
    timers.push(window.setTimeout(() => setStage(3), 600));
    timers.push(window.setTimeout(() => setStage(4), 980));
    timers.push(
      window.setTimeout(() => {
        try {
          window.localStorage.setItem(KEY, isoDate());
        } catch {
          /* ignore */
        }
        setActive(false);
      }, 1500),
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const value = useMemo<IntroContextValue>(() => ({ stage, active }), [stage, active]);

  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

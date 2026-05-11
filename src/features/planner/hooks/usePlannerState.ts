import { useEffect, useState } from "react";
import { useDebouncedEffect } from "@/hooks/use-debounce";
import { clearState, EMPTY_STATE, loadState, saveState } from "../storage";
import type { PlannerState } from "../types";

export function usePlannerState() {
  const [state, setState] = useState<PlannerState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadState().then((s) => {
      if (!cancelled) {
        setState(s);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useDebouncedEffect(
    () => {
      if (hydrated) void saveState(state);
    },
    [state, hydrated],
    400,
  );

  const flushSave = () => {
    if (hydrated) void saveState(state);
  };

  const resetPlanner = async () => {
    await clearState();
    setState(EMPTY_STATE);
  };

  return { state, setState, hydrated, flushSave, resetPlanner };
}

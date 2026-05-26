import { useEffect, useRef, useState } from "react";
import { useDebouncedEffect } from "@/hooks/use-debounce";
import {
  clearState,
  EMPTY_STATE,
  isoDate,
  loadRolloverQueue,
  loadState,
  saveRolloverQueue,
  saveState,
} from "../storage";
import { insertRolloverTask } from "../rollover";
import type { PlannerState, RolloverTask } from "../types";

export function usePlannerState() {
  const [state, setState] = useState<PlannerState>(EMPTY_STATE);
  const [rolloverQueue, setRolloverQueue] = useState<RolloverTask[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const activeDateRef = useRef(isoDate());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadState(), loadRolloverQueue()]).then(([s, queue]) => {
      if (!cancelled) {
        setState(s);
        setRolloverQueue(queue);
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

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setInterval(() => {
      const today = isoDate();
      if (today === activeDateRef.current) return;
      activeDateRef.current = today;
      void saveState(stateRef.current).then(async () => {
        const nextState = await loadState();
        const nextQueue = await loadRolloverQueue();
        setState(nextState);
        setRolloverQueue(nextQueue);
      });
    }, 60_000);
    return () => window.clearInterval(id);
  }, [hydrated]);

  const flushSave = () => {
    if (hydrated) void saveState(state);
  };

  const resetPlanner = async () => {
    await clearState();
    setState(EMPTY_STATE);
    setRolloverQueue([]);
  };

  const claimRolloverTask = (task: RolloverTask) => {
    setState((current) => insertRolloverTask(current, task));
    setRolloverQueue((current) => {
      const next = current.filter((item) => item.id !== task.id);
      void saveRolloverQueue(next);
      return next;
    });
  };

  const dropRolloverTask = (task: RolloverTask) => {
    setRolloverQueue((current) => {
      const next = current.filter((item) => item.id !== task.id);
      void saveRolloverQueue(next);
      return next;
    });
  };

  return {
    state,
    setState,
    rolloverQueue,
    hydrated,
    flushSave,
    resetPlanner,
    claimRolloverTask,
    dropRolloverTask,
  };
}

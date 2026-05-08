import { useEffect, useRef, useState } from "react";

export function useMitFocus(mitSubCount: number) {
  const pendingMitFocusRef = useRef<number | null>(null);
  const [pendingMitFocusTick, setPendingMitFocusTick] = useState(0);

  useEffect(() => {
    const target = pendingMitFocusRef.current;
    if (target === null) return;
    let tries = 0;
    const tryFocus = () => {
      const el = document.querySelector<HTMLInputElement>(`input[data-mit-sub-index="${target}"]`);
      if (el && !el.readOnly) {
        el.focus();
        pendingMitFocusRef.current = null;
        return;
      }
      if (tries++ < 30) requestAnimationFrame(tryFocus);
      else pendingMitFocusRef.current = null;
    };
    requestAnimationFrame(tryFocus);
  }, [pendingMitFocusTick, mitSubCount]);

  return (index: number) => {
    pendingMitFocusRef.current = index;
    setPendingMitFocusTick((t) => t + 1);
  };
}

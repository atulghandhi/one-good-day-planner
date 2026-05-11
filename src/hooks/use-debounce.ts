import { useEffect, useRef } from "react";

export function useDebouncedEffect(effect: () => void, deps: unknown[], delay = 400) {
  const cb = useRef(effect);
  cb.current = effect;

  useEffect(() => {
    const t = setTimeout(() => cb.current(), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

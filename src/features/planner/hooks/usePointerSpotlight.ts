import { useEffect } from "react";

export function usePointerSpotlight() {
  useEffect(() => {
    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.documentElement.style.setProperty("--mx", `${pendingX}px`);
        document.documentElement.style.setProperty("--my", `${pendingY}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

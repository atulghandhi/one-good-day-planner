import { useEffect, useRef } from "react";

/**
 * Sparkling glitter that falls from the top of the page.
 * When a flake reaches the top of the MIT card (the first <section>),
 * it settles on top, building up a pile like snow. Hovering near the pile
 * makes nearby flakes glitter brightly once, then vanish.
 *
 * Active only when html[data-theme] is "sakura" or "blossom"
 * (controlled by parent visibility — this component only runs when mounted).
 */

type Flake = {
  x: number;          // px from left
  y: number;          // px from top
  vy: number;         // fall speed px/s
  vx: number;         // horizontal drift
  rot: number;
  vRot: number;
  size: number;       // px
  hue: number;        // 0-360
  twinkle: number;    // phase offset
  settled: boolean;
  vanishing: number;  // 0 = alive, >0 = vanishing progress (0..1)
};

const FLAKE_HUES = [340, 320, 30, 50, 290, 200];
const SETTLE_FADE_MS = 600;

export function GlitterRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flakesRef = useRef<Flake[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Spawn helpers
    const spawn = () => {
      const W = window.innerWidth;
      const f: Flake = {
        x: Math.random() * W,
        y: -10,
        vy: 40 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 20,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2,
        size: 4 + Math.random() * 5,
        hue: FLAKE_HUES[Math.floor(Math.random() * FLAKE_HUES.length)],
        twinkle: Math.random() * Math.PI * 2,
        settled: false,
        vanishing: 0,
      };
      flakesRef.current.push(f);
    };

    // pre-seed
    for (let i = 0; i < 40; i++) {
      spawn();
      flakesRef.current[i].y = Math.random() * window.innerHeight * 0.4;
    }

    let lastSpawn = 0;
    let last = performance.now();

    // Draw a 4-point sparkle star
    const drawSparkle = (
      x: number,
      y: number,
      size: number,
      rot: number,
      hue: number,
      alpha: number,
      brightness: number,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      const glowAlpha = Math.min(1, alpha * brightness);
      // outer glow
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2.4);
      grad.addColorStop(0, `oklch(0.98 0.22 ${hue} / ${0.9 * glowAlpha})`);
      grad.addColorStop(0.5, `oklch(0.85 0.2 ${hue} / ${0.35 * glowAlpha})`);
      grad.addColorStop(1, `oklch(0.85 0.2 ${hue} / 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, size * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 4-point star
      ctx.fillStyle = `oklch(0.99 0.18 ${hue} / ${alpha})`;
      const s = size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
      // bright center
      ctx.fillStyle = `oklch(1 0.05 ${hue} / ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // spawn rate
      if (now - lastSpawn > 80) {
        lastSpawn = now;
        if (flakesRef.current.length < 180) spawn();
      }

      // find pile barrier: top of first <section> (MIT card) — fall back to a high y if missing
      const mitSection = document.querySelector("main section");
      let barrierY = window.innerHeight + 9999;
      let barrierLeft = 0;
      let barrierRight = window.innerWidth;
      if (mitSection) {
        const r = mitSection.getBoundingClientRect();
        // settle right above the card top edge
        barrierY = r.top;
        barrierLeft = r.left;
        barrierRight = r.right;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const flakes = flakesRef.current;
      for (let i = flakes.length - 1; i >= 0; i--) {
        const f = flakes[i];

        if (f.vanishing > 0) {
          f.vanishing += dt / 0.45;
          if (f.vanishing >= 1) {
            flakes.splice(i, 1);
            continue;
          }
          const a = 1 - f.vanishing;
          const burst = 1 + f.vanishing * 1.8;
          drawSparkle(f.x, f.y, f.size * burst, f.rot, f.hue, a, 2);
          continue;
        }

        if (!f.settled) {
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.rot += f.vRot * dt;
          f.twinkle += dt * 6;

          // settle if it lands on the pile area above the MIT card
          if (
            f.x >= barrierLeft &&
            f.x <= barrierRight &&
            f.y >= barrierY - 4
          ) {
            // Determine pile height at this x by scanning settled flakes nearby
            let topAtX = barrierY;
            for (const o of flakes) {
              if (!o.settled) continue;
              if (Math.abs(o.x - f.x) < o.size * 1.4) {
                if (o.y < topAtX) topAtX = o.y;
              }
            }
            f.y = topAtX - f.size * 0.9;
            f.vy = 0;
            f.vx = 0;
            f.vRot = 0;
            f.settled = true;
          } else if (f.y > window.innerHeight + 20) {
            flakes.splice(i, 1);
            continue;
          }
        }

        // Mouse interaction near settled flakes — sparkle then vanish
        if (f.settled) {
          const dx = f.x - mx;
          const dy = f.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < 60 * 60) {
            f.vanishing = 0.001;
          }
        }

        // Twinkle alpha
        const tw = f.settled
          ? 0.85 + Math.sin(now / 220 + f.twinkle) * 0.15
          : 0.7 + Math.sin(now / 180 + f.twinkle) * 0.3;
        const brightness = f.settled ? 1.2 : 1;
        drawSparkle(f.x, f.y, f.size, f.rot, f.hue, tw, brightness);
      }

      // Cap settled flakes (avoid infinite buildup)
      let settledCount = 0;
      for (let i = flakes.length - 1; i >= 0; i--) {
        if (flakes[i].settled && flakes[i].vanishing === 0) {
          settledCount++;
          if (settledCount > 220) {
            flakes.splice(i, 1);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="glitter-canvas pointer-events-none fixed inset-0 z-[1]"
    />
  );
}
// SETTLE_FADE_MS unused — kept as design ref
void SETTLE_FADE_MS;

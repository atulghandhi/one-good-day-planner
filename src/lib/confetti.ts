import confetti from "canvas-confetti";
import kirbyImg from "@/assets/kirby.png";

function readVar(name: string): string {
  if (typeof document === "undefined") return "#ff7eb6";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || "#ff7eb6";
}

function currentTheme(): string {
  if (typeof document === "undefined") return "blossom";
  return document.documentElement.getAttribute("data-theme") || "blossom";
}

// canvas-confetti accepts CSS color strings, including oklch().
function toneColors(tone: "mit" | "should" | "could"): string[] {
  const theme = currentTheme();
  if (theme === "sakura") {
    // Multicoloured rainbow palette for sakura
    return [
      "#ff5d8f", "#ffb3c6", "#ffd166", "#06d6a0",
      "#118ab2", "#9b5de5", "#f15bb5", "#fee440",
    ];
  }
  const base = readVar(`--${tone}`);
  const sun = readVar("--sun");
  const sky = readVar("--sky");
  const other =
    tone === "mit"
      ? readVar("--could")
      : tone === "should"
        ? readVar("--mit")
        : readVar("--should");
  return [base, other, sun, sky];
}

/* ---------------- Kirby confetti shape (sakura only) ---------------- */

type AnyShape = confetti.Shape;
let kirbyShape: AnyShape | null = null;
let kirbyShapePromise: Promise<AnyShape | null> | null = null;

function loadKirbyShape(): Promise<AnyShape | null> {
  if (kirbyShape) return Promise.resolve(kirbyShape);
  if (kirbyShapePromise) return kirbyShapePromise;
  const shapeFromImage = (confetti as unknown as {
    shapeFromImage?: (opts: { src: string; width?: number; height?: number }) => AnyShape;
  }).shapeFromImage;
  kirbyShapePromise = new Promise((resolve) => {
    if (typeof Image === "undefined" || !shapeFromImage) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        kirbyShape = shapeFromImage({ src: kirbyImg, width: 24, height: 24 });
        resolve(kirbyShape);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = kirbyImg;
  });
  return kirbyShapePromise;
}

if (typeof window !== "undefined") {
  // Preload kirby shape so first burst includes kirbies
  void loadKirbyShape();
}

/* ---------------- Shooting stars (starry theme) ---------------- */

function shootingStars(count: number) {
  if (typeof document === "undefined") return;
  const layer = ensureStarLayer();
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnShootingStar(layer), i * 25 + Math.random() * 80);
  }
}

function ensureStarLayer(): HTMLDivElement {
  let el = document.getElementById("shooting-star-layer") as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "shooting-star-layer";
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.pointerEvents = "none";
    el.style.zIndex = "60";
    el.style.overflow = "hidden";
    document.body.appendChild(el);
  }
  return el;
}

function spawnShootingStar(layer: HTMLDivElement) {
  const star = document.createElement("div");
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Travel distance must exceed the screen diagonal so stars exit past edges
  const diag = Math.hypot(w, h);
  const travel = diag * 1.2 + 400;

  // Angle roughly toward lower-right, with variation
  const angleRad = (Math.PI / 6) + (Math.random() * Math.PI) / 3; // 30°..90°
  const dx = Math.cos(angleRad) * travel;
  const dy = Math.sin(angleRad) * travel;

  // Start off-screen top/left so the full streak crosses the viewport
  const startX = Math.random() * w * 0.9 - w * 0.25;
  const startY = Math.random() * h * 0.6 - h * 0.3;

  const len = 70 + Math.random() * 140;
  const angleDeg = (angleRad * 180) / Math.PI;

  // Vary speed: faster stars = shorter duration
  const dur = 500 + Math.random() * 1100;

  // Vary brightness
  const brightness = 0.45 + Math.random() * 0.55;
  const glow = 6 + Math.random() * 18;

  star.style.position = "absolute";
  star.style.left = `${startX}px`;
  star.style.top = `${startY}px`;
  star.style.width = `${len}px`;
  star.style.height = `${1 + Math.random() * 1.5}px`;
  star.style.background =
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 60%, #b6d4ff)";
  star.style.borderRadius = "999px";
  star.style.transform = `rotate(${angleDeg}deg)`;
  star.style.transformOrigin = "left center";
  star.style.boxShadow = `0 0 ${glow}px rgba(255,255,255,${brightness}), 0 0 ${glow * 2}px rgba(158,197,255,${brightness * 0.7})`;
  star.style.opacity = "0";
  star.style.willChange = "transform, opacity";
  star.style.transition = `transform ${dur}ms linear, opacity ${dur}ms ease-out`;

  layer.appendChild(star);

  requestAnimationFrame(() => {
    star.style.opacity = String(brightness);
    star.style.transform = `translate(${dx}px, ${dy}px) rotate(${angleDeg}deg)`;
    setTimeout(() => {
      star.style.opacity = "0";
    }, dur * 0.85);
  });

  setTimeout(() => {
    star.remove();
  }, dur + 200);
}

/* ---------------- Public API ---------------- */

export function bigConfetti() {
  if (currentTheme() === "starry") {
    shootingStars(14);
    return;
  }
  const colors = toneColors("mit");
  const isSakura = currentTheme() === "sakura";
  const end = Date.now() + 700;

  const fire = async () => {
    const shape = isSakura ? await loadKirbyShape() : null;

    const baseOpts = { colors, ticks: 220 };

    confetti({
      ...baseOpts,
      particleCount: 70,
      spread: 75,
      startVelocity: 55,
      origin: { x: 0.2, y: 0.7 },
      scalar: 1.1,
    });
    confetti({
      ...baseOpts,
      particleCount: 70,
      spread: 75,
      startVelocity: 55,
      origin: { x: 0.8, y: 0.7 },
      scalar: 1.1,
    });
    confetti({
      ...baseOpts,
      particleCount: 120,
      spread: 110,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.6 },
      scalar: 1.3,
    });

    if (shape) {
      // Kirby pieces — ~3x scalar, launched from same cannons
      const kirbyOpts = {
        shapes: [shape],
        scalar: 3,
        ticks: 260,
        gravity: 1,
      };
      confetti({
        ...kirbyOpts,
        particleCount: 6,
        spread: 75,
        startVelocity: 55,
        origin: { x: 0.2, y: 0.7 },
      });
      confetti({
        ...kirbyOpts,
        particleCount: 6,
        spread: 75,
        startVelocity: 55,
        origin: { x: 0.8, y: 0.7 },
      });
      confetti({
        ...kirbyOpts,
        particleCount: 10,
        spread: 110,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.6 },
      });
    }
  };
  void fire();
  setTimeout(() => {
    if (Date.now() < end) {
      confetti({
        particleCount: 60,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors,
        scalar: 1.1,
      });
    }
  }, 220);
}

export function smallConfetti(
  tone: "mit" | "should" | "could",
  source?: HTMLElement | null,
) {
  if (currentTheme() === "starry") {
    shootingStars(3);
    return;
  }
  const colors = toneColors(tone);
  const isSakura = currentTheme() === "sakura";
  let origin = { x: 0.5, y: 0.5 };
  if (source && typeof window !== "undefined") {
    const r = source.getBoundingClientRect();
    origin = {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight,
    };
  }
  confetti({
    particleCount: 28,
    spread: 65,
    startVelocity: 32,
    origin,
    colors,
    scalar: 0.85,
    ticks: 140,
    gravity: 1,
  });

  if (isSakura) {
    void loadKirbyShape().then((shape) => {
      if (!shape) return;
      confetti({
        shapes: [shape],
        particleCount: 2,
        spread: 65,
        startVelocity: 32,
        origin,
        scalar: 2.5,
        ticks: 180,
        gravity: 1,
      });
    });
  }
}

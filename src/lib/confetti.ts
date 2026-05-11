import confetti from "canvas-confetti";
import kirbyImg from "@/assets/kirby.png";

function readVar(name: string): string {
  if (typeof document === "undefined") return "#ff7eb6";
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
    return ["#ff5d8f", "#ffb3c6", "#ffd166", "#06d6a0", "#118ab2", "#9b5de5", "#f15bb5", "#fee440"];
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
  const shapeFromImage = (
    confetti as unknown as {
      shapeFromImage?: (opts: { src: string; width?: number; height?: number }) => AnyShape;
    }
  ).shapeFromImage;
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
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Diagonal travel: top-left-ish to bottom-right-ish, like a real shooting star
  const angleDeg = 18 + Math.random() * 14; // 18°..32° downward
  const angleRad = (angleDeg * Math.PI) / 180;
  const travel = Math.hypot(w, h) + 400;
  const dx = Math.cos(angleRad) * travel;
  const dy = Math.sin(angleRad) * travel;

  // Start somewhere near the top, off-screen left
  const startX = -200 - Math.random() * 200;
  const startY = -100 + Math.random() * (h * 0.55);

  // Faster — quick streak
  const dur = 700 + Math.random() * 600;
  const headSize = 5 + Math.random() * 4;
  const tailLen = 140 + Math.random() * 220;
  const brightness = 0.9 + Math.random() * 0.1;

  // Container that translates as one unit (head + tail + sparkle cross)
  const star = document.createElement("div");
  star.style.position = "absolute";
  star.style.left = `${startX}px`;
  star.style.top = `${startY}px`;
  star.style.width = "0";
  star.style.height = "0";
  star.style.willChange = "transform, opacity";
  star.style.transition = `transform ${dur}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${dur}ms ease-out`;
  star.style.opacity = "0";
  star.style.transform = `rotate(${angleDeg}deg)`;

  // Tail: tapered streak fading to transparent BEHIND the head
  const tail = document.createElement("div");
  tail.style.position = "absolute";
  tail.style.right = "0";
  tail.style.top = `${-headSize * 0.35}px`;
  tail.style.width = `${tailLen}px`;
  tail.style.height = `${headSize * 0.7}px`;
  tail.style.background = `linear-gradient(90deg,
    rgba(255,255,255,0) 0%,
    rgba(170,200,255,${brightness * 0.15}) 30%,
    rgba(220,230,255,${brightness * 0.55}) 70%,
    rgba(255,255,255,${brightness}) 100%)`;
  tail.style.borderRadius = "999px";
  tail.style.filter = `blur(0.5px)`;
  star.appendChild(tail);

  // Head: bright round glow
  const head = document.createElement("div");
  head.style.position = "absolute";
  head.style.right = `${-headSize * 0.4}px`;
  head.style.top = `${-headSize * 0.5}px`;
  head.style.width = `${headSize * 1.6}px`;
  head.style.height = `${headSize * 1.6}px`;
  head.style.borderRadius = "50%";
  head.style.background = `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(220,235,255,0.95) 35%, rgba(160,200,255,0.5) 65%, rgba(120,170,255,0) 100%)`;
  head.style.boxShadow = `0 0 ${headSize * 3}px rgba(255,255,255,${brightness}), 0 0 ${headSize * 6}px rgba(180,210,255,${brightness * 0.7}), 0 0 ${headSize * 12}px rgba(140,180,255,${brightness * 0.35})`;
  star.appendChild(head);

  // Cross sparkle on the head — gives it that twinkling star shape
  const sparkleSize = headSize * 6;
  const sparkle = document.createElement("div");
  sparkle.style.position = "absolute";
  sparkle.style.right = `${-sparkleSize / 2 + headSize * 0.4}px`;
  sparkle.style.top = `${-sparkleSize / 2 + headSize * 0.3}px`;
  sparkle.style.width = `${sparkleSize}px`;
  sparkle.style.height = `${sparkleSize}px`;
  sparkle.style.background = `
    radial-gradient(ellipse 50% 4% at 50% 50%, rgba(255,255,255,${brightness}) 0%, rgba(255,255,255,0) 70%),
    radial-gradient(ellipse 4% 50% at 50% 50%, rgba(255,255,255,${brightness}) 0%, rgba(255,255,255,0) 70%)`;
  sparkle.style.opacity = "0.9";
  star.appendChild(sparkle);

  layer.appendChild(star);

  // Animate: fade in fast, translate, fade out near end
  requestAnimationFrame(() => {
    star.style.opacity = String(brightness);
    star.style.transform = `translate(${dx}px, ${dy}px) rotate(${angleDeg}deg)`;
  });

  // Fade out in last 30%
  setTimeout(() => {
    star.style.opacity = "0";
  }, dur * 0.7);

  setTimeout(() => {
    star.remove();
  }, dur + 100);
}

/* ---------------- Public API ---------------- */

export function bigConfetti() {
  if (currentTheme() === "starry") {
    shootingStars(80);
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

export function smallConfetti(tone: "mit" | "should" | "could", source?: HTMLElement | null) {
  if (currentTheme() === "starry") {
    shootingStars(14);
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

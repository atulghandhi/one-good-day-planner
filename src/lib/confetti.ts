import confetti from "canvas-confetti";

function readVar(name: string): string {
  if (typeof document === "undefined") return "#ff7eb6";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || "#ff7eb6";
}

// canvas-confetti accepts CSS color strings, including oklch().
function toneColors(tone: "mit" | "should" | "could"): string[] {
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

export function bigConfetti() {
  const colors = toneColors("mit");
  const end = Date.now() + 700;
  const fire = () => {
    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 55,
      origin: { x: 0.2, y: 0.7 },
      colors,
      scalar: 1.1,
      ticks: 220,
    });
    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 55,
      origin: { x: 0.8, y: 0.7 },
      colors,
      scalar: 1.1,
      ticks: 220,
    });
    confetti({
      particleCount: 120,
      spread: 110,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.6 },
      colors,
      scalar: 1.3,
      ticks: 260,
    });
  };
  fire();
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
  const colors = toneColors(tone);
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
}

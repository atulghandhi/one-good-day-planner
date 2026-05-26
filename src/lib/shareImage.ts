import type { PlannerState } from "@/features/planner/types";
import { htmlToPlainText } from "@/features/planner/text";

export type ShareSize = "story" | "social";

const SIZES: Record<ShareSize, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  social: { width: 1200, height: 630 },
};

function readCssVar(name: string): string {
  if (typeof document === "undefined") return "#fff";
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || "#fff";
}

/**
 * Returns a Blob (PNG) of a beautifully laid-out share card for today's plan,
 * using the live theme's colours.
 */
export async function renderShareCard(
  state: PlannerState,
  date: string,
  size: ShareSize = "story",
): Promise<Blob> {
  const { width, height } = SIZES[size];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Background: theme gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  // We can't read the linear-gradient() string directly into canvas, so approximate
  // from the theme colour vars.
  const sky = readCssVar("--sky") || "#bce0ff";
  const sun = readCssVar("--sun") || "#ffd987";
  const could = readCssVar("--could") || "#cdb6ff";
  grad.addColorStop(0, sun);
  grad.addColorStop(0.5, sky);
  grad.addColorStop(1, could);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Soft white card
  const padding = size === "story" ? 80 : 60;
  const cardX = padding;
  const cardY = padding;
  const cardW = width - padding * 2;
  const cardH = height - padding * 2;
  const cardR = 56;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();

  const innerX = cardX + 70;
  const innerW = cardW - 140;
  let y = cardY + 96;

  // Eyebrow: date
  ctx.fillStyle = "rgba(80,80,110,0.7)";
  ctx.font = `700 28px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(formatDate(date).toUpperCase(), innerX, y);
  y += 60;

  // Title: One good day.
  ctx.fillStyle = "#1a1a2a";
  const titleSize = size === "story" ? 96 : 72;
  ctx.font = `500 ${titleSize}px Fraunces, Georgia, serif`;
  ctx.fillText("One good day.", innerX, y);
  y += titleSize * 0.7;

  // Subtitle
  ctx.fillStyle = "rgba(80,80,110,0.85)";
  ctx.font = `450 32px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillText("Pick what matters. Let the rest go.", innerX, y);
  y += 80;

  // MIT block
  const mitText = htmlToPlainText(state.mit).trim();
  if (mitText) {
    ctx.fillStyle = readCssVar("--mit") || "#ff8a7a";
    ctx.font = `700 24px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillText("★ THE ONE THING", innerX, y);
    y += 50;

    ctx.fillStyle = "#1a1a2a";
    const mitFontSize = size === "story" ? 54 : 42;
    ctx.font = `500 ${mitFontSize}px Fraunces, Georgia, serif`;
    y = wrapText(ctx, mitText, innerX, y, innerW, mitFontSize * 1.18);
    y += 30;
    if (state.mitDone) {
      ctx.fillStyle = "rgba(0,150,80,0.8)";
      ctx.font = `600 24px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.fillText("✓ done", innerX, y);
      y += 60;
    } else {
      y += 30;
    }
  }

  // Shoulds
  y = drawList(
    ctx,
    "Shoulds",
    readCssVar("--should") || "#9eeac0",
    state.shoulds.filter((s) => s.text.trim()).map((s) => ({ text: s.text, done: s.done })),
    innerX,
    y,
    innerW,
    size,
  );

  // Coulds
  y = drawList(
    ctx,
    "Coulds",
    readCssVar("--could") || "#cdb6ff",
    state.coulds.filter((s) => s.text.trim()).map((s) => ({ text: s.text, done: s.done })),
    innerX,
    y,
    innerW,
    size,
  );

  // Footer wordmark
  ctx.fillStyle = "rgba(80,80,110,0.55)";
  ctx.font = `500 22px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillText("one-good-day", innerX, cardY + cardH - 60);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("toBlob failed"));
    }, "image/png");
  });
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = words[i];
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

function drawList(
  ctx: CanvasRenderingContext2D,
  heading: string,
  accent: string,
  items: { text: string; done: boolean }[],
  x: number,
  y: number,
  width: number,
  size: ShareSize,
): number {
  if (items.length === 0) return y;
  ctx.fillStyle = accent;
  ctx.font = `500 36px Fraunces, Georgia, serif`;
  ctx.fillText(heading, x, y);
  y += 50;
  ctx.fillStyle = "#1a1a2a";
  const itemFont = size === "story" ? 30 : 24;
  ctx.font = `450 ${itemFont}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  for (const it of items.slice(0, 6)) {
    const prefix = it.done ? "✓  " : "•  ";
    const line = prefix + it.text;
    y = wrapText(ctx, line, x, y, width, itemFont * 1.4);
  }
  return y + 30;
}

export async function shareToday(state: PlannerState, date: string) {
  const blob = await renderShareCard(state, date, "story");
  const filename = `one-good-day-${date}.png`;
  const file = new File([blob], filename, { type: "image/png" });
  if (
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: "One good day." });
      return;
    } catch {
      /* fall through to download */
    }
  }
  // Download fallback
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import { connectorPathFromPoints } from "./canvas";
import { CENTER_BOX } from "./constants";
import type { Idea, Placed, ShapeKey, ShapeTheme, SketchPalette } from "./types";

type ExportBrainstormSvgOptions = {
  title: string;
  ideas: Idea[];
  placements: Placed[];
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
};

const EXPORT_PADDING = 180;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugifyFilename(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "brainstorm";
}

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function wrapText(value: string, maxChars: number, maxLines: number) {
  const words = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });

  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = `${clipped[maxLines - 1].slice(0, Math.max(1, maxChars - 1))}...`;
  return clipped;
}

function textSvg(
  lines: string[],
  centerX: number,
  centerY: number,
  fontSize: number,
  fill: string,
) {
  const lineHeight = fontSize * 1.22;
  const startY = centerY - ((lines.length - 1) * lineHeight) / 2;
  return lines
    .map(
      (line, index) =>
        `<text x="${centerX}" y="${startY + index * lineHeight}" text-anchor="middle" dominant-baseline="middle" fill="${fill}" font-size="${fontSize}" font-weight="800">${escapeXml(line)}</text>`,
    )
    .join("");
}

function rectSvg(
  box: Placed,
  offset: { x: number; y: number },
  shape: ShapeKey,
  fill: string,
  stroke: string,
  strokeWidth: number,
) {
  const x = box.x + offset.x - box.w / 2;
  const y = box.y + offset.y - box.h / 2;

  if (shape === "blob") {
    return `<ellipse cx="${box.x + offset.x}" cy="${box.y + offset.y}" rx="${box.w / 2}" ry="${box.h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
  }

  return `<rect x="${x}" y="${y}" width="${box.w}" height="${box.h}" rx="${shape === "boxy" ? 6 : Math.min(28, box.h / 2)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

export function createBrainstormSvg({
  title,
  ideas,
  placements,
  shape,
  theme,
  sketchPalette,
}: ExportBrainstormSvgOptions) {
  const boxes = [CENTER_BOX, ...placements];
  const minX = Math.min(...boxes.map((box) => box.x - box.w / 2)) - EXPORT_PADDING;
  const minY = Math.min(...boxes.map((box) => box.y - box.h / 2)) - EXPORT_PADDING;
  const maxX = Math.max(...boxes.map((box) => box.x + box.w / 2)) + EXPORT_PADDING;
  const maxY = Math.max(...boxes.map((box) => box.y + box.h / 2)) + EXPORT_PADDING;
  const width = Math.ceil(maxX - minX);
  const height = Math.ceil(maxY - minY);
  const offset = { x: -minX, y: -minY };
  const placementById = new Map<string, Placed>();
  ideas.forEach((idea, index) => {
    const placement = placements[index];
    if (placement) placementById.set(idea.id, placement);
  });

  const foreground = shape === "blob" ? sketchPalette.ink : cssVar("--foreground", "#17131f");
  const paper = shape === "blob" ? sketchPalette.paper : cssVar("--background", "#fff8ef");
  const card = shape === "blob" ? sketchPalette.card : cssVar("--card", "#ffffff");
  const marker = shape === "blob" ? sketchPalette.markerDark : cssVar("--mit", "#f3a6a1");
  const line = shape === "blob" ? sketchPalette.line : cssVar("--mit", "#f3a6a1");
  const fontFamily = theme.fontFamily.replace(/"/g, "'");

  const connectors = ideas
    .map((idea, index) => {
      const to = placements[index];
      if (!to) return "";
      const from = idea.parentId ? placementById.get(idea.parentId) : CENTER_BOX;
      if (!from) return "";
      const start = { x: from.x + offset.x, y: from.y + offset.y };
      const end = { x: to.x + offset.x, y: to.y + offset.y };
      const path = connectorPathFromPoints(start, end, theme.lineMode, index);
      return `<path d="${path}" fill="none" stroke="${line}" stroke-width="${shape === "blob" ? 3 : 2.4}" stroke-linecap="${shape === "boxy" ? "square" : "round"}" stroke-linejoin="${shape === "boxy" ? "miter" : "round"}" opacity="0.72" />`;
    })
    .join("");

  const centerBox = rectSvg(CENTER_BOX, offset, shape, card, marker, shape === "blob" ? 8 : 3);
  const centerText = textSvg(
    wrapText(title || "Options", 22, 2),
    CENTER_BOX.x + offset.x,
    CENTER_BOX.y + offset.y,
    shape === "blob" ? 38 : 28,
    foreground,
  );

  const nodeSvgs = ideas
    .map((idea, index) => {
      const placement = placements[index];
      if (!placement) return "";
      const depth = Math.max(0, idea.parentId ? 1 : 0);
      const stroke =
        shape === "blob"
          ? sketchPalette.childMarkers[index % sketchPalette.childMarkers.length].markerDark
          : marker;
      const node = rectSvg(placement, offset, shape, card, stroke, shape === "blob" ? 5 : 2);
      const text = textSvg(
        wrapText(idea.text, Math.max(10, Math.floor(placement.w / 11)), 3),
        placement.x + offset.x,
        placement.y + offset.y,
        Math.max(12, 17 - depth),
        foreground,
      );
      return `${node}${text}`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${paper}" />
  <g font-family="${escapeXml(fontFamily)}" letter-spacing="0">
    ${connectors}
    ${centerBox}
    ${centerText}
    ${nodeSvgs}
  </g>
</svg>`;
}

export function downloadBrainstormSvg(options: ExportBrainstormSvgOptions) {
  const svg = createBrainstormSvg(options);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugifyFilename(options.title || "brainstorm")}.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

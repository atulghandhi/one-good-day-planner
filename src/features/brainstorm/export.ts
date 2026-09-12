import { connectorPathFromPoints } from "./canvas";
import { effectiveIdeaKind, ideaKindLabel } from "./kinds";
import type { Idea, IdeaKind, Placed, ShapeKey, ShapeTheme, SketchPalette } from "./types";

type ExportBrainstormSvgOptions = {
  title: string;
  ideas: Idea[];
  placements: Placed[];
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  filterKind?: IdeaKind | null;
};

const EXPORT_PADDING = 180;

export type BrainstormExportFormat = "svg" | "png" | "pdf" | "markdown";

type BrainstormSvgDocument = {
  svg: string;
  width: number;
  height: number;
};

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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filenameFor(options: ExportBrainstormSvgOptions, extension: string) {
  const filterSuffix = options.filterKind ? ` ${ideaKindLabel(options.filterKind)}` : "";
  return `${slugifyFilename(`${options.title || "brainstorm"}${filterSuffix}`)}.${extension}`;
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

export function createBrainstormSvgDocument({
  title,
  ideas,
  placements,
  shape,
  theme,
  sketchPalette,
}: ExportBrainstormSvgOptions): BrainstormSvgDocument {
  const boxes = placements.length > 0 ? placements : [{ x: 0, y: 0, w: 420, h: 240 }];
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
      const from = idea.parentId ? placementById.get(idea.parentId) : undefined;
      if (!from) return "";
      const start = { x: from.x + offset.x, y: from.y + offset.y };
      const end = { x: to.x + offset.x, y: to.y + offset.y };
      const path = connectorPathFromPoints(start, end, theme.lineMode, index);
      return `<path d="${path}" fill="none" stroke="${line}" stroke-width="${shape === "blob" ? 3 : 2.4}" stroke-linecap="${shape === "boxy" ? "square" : "round"}" stroke-linejoin="${shape === "boxy" ? "miter" : "round"}" opacity="0.72" />`;
    })
    .join("");

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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${paper}" />
  <g font-family="${escapeXml(fontFamily)}" letter-spacing="0">
    ${connectors}
    ${nodeSvgs}
  </g>
</svg>`;

  return { svg, width, height };
}

export function createBrainstormSvg(options: ExportBrainstormSvgOptions) {
  return createBrainstormSvgDocument(options).svg;
}

function loadSvgImage(svg: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not render SVG export"));
    };
    image.src = url;
  });
}

async function createExportCanvas(options: ExportBrainstormSvgOptions) {
  const { svg, width, height } = createBrainstormSvgDocument(options);
  const image = await loadSvgImage(svg);
  const scale = Math.min(2, 4096 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create export canvas");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create export image"));
      },
      type,
      quality,
    );
  });
}

function binaryStringToBytes(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function createPdfFromJpeg(jpegDataUrl: string, width: number, height: number) {
  const base64 = jpegDataUrl.split(",")[1] ?? "";
  const imageBytes = binaryStringToBytes(window.atob(base64));
  const encoder = new TextEncoder();
  const chunks: BlobPart[] = [];
  const offsets: number[] = [0];
  let length = 0;

  const addBytes = (bytes: Uint8Array) => {
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    chunks.push(copy.buffer);
    length += bytes.length;
  };
  const addText = (text: string) => addBytes(encoder.encode(text));
  const addObject = (id: number, body: string) => {
    offsets[id] = length;
    addText(`${id} 0 obj\n${body}\nendobj\n`);
  };

  addText("%PDF-1.4\n");
  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
  );
  const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
  addObject(4, `<< /Length ${content.length} >>\nstream\n${content}endstream`);

  offsets[5] = length;
  addText(
    `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
  );
  addBytes(imageBytes);
  addText("\nendstream\nendobj\n");

  const xrefOffset = length;
  addText("xref\n0 6\n0000000000 65535 f \n");
  for (let id = 1; id <= 5; id += 1) {
    addText(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  addText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: "application/pdf" });
}

function escapeMarkdown(value: string) {
  return value.replace(/([\\`*_{}[\]()#+\-.!|>])/g, "\\$1");
}

export function createBrainstormMarkdown({
  title,
  ideas,
  filterKind,
}: Pick<ExportBrainstormSvgOptions, "title" | "ideas" | "filterKind">) {
  const includedIds = new Set(ideas.map((idea) => idea.id));
  const childrenByParent = new Map<string, Idea[]>();
  const roots: Idea[] = [];

  ideas.forEach((idea) => {
    const parentId = idea.parentId && includedIds.has(idea.parentId) ? idea.parentId : undefined;
    if (!parentId) {
      roots.push(idea);
      return;
    }
    childrenByParent.set(parentId, [...(childrenByParent.get(parentId) ?? []), idea]);
  });

  const lines = [`# ${escapeMarkdown(title || "Options")}`, ""];
  if (filterKind) {
    lines.push(`_Filtered to ${ideaKindLabel(filterKind)} nodes._`, "");
  }

  const writeIdea = (idea: Idea, depth: number) => {
    const kind = effectiveIdeaKind(idea);
    const tag = kind === "idea" ? "" : ` _${ideaKindLabel(kind)}_`;
    const done = idea.done ? " [done]" : "";
    lines.push(`${"  ".repeat(depth)}- ${escapeMarkdown(idea.text)}${tag}${done}`);
    (childrenByParent.get(idea.id) ?? []).forEach((child) => writeIdea(child, depth + 1));
  };

  roots.forEach((idea) => writeIdea(idea, 0));
  if (roots.length === 0) lines.push("_No matching nodes._");

  return `${lines.join("\n")}\n`;
}

export async function downloadBrainstormExport(
  options: ExportBrainstormSvgOptions,
  format: BrainstormExportFormat,
) {
  if (format === "svg") {
    downloadBlob(
      new Blob([createBrainstormSvg(options)], { type: "image/svg+xml;charset=utf-8" }),
      filenameFor(options, "svg"),
    );
    return;
  }

  if (format === "markdown") {
    downloadBlob(
      new Blob([createBrainstormMarkdown(options)], { type: "text/markdown;charset=utf-8" }),
      filenameFor(options, "md"),
    );
    return;
  }

  const canvas = await createExportCanvas(options);
  if (format === "png") {
    downloadBlob(await canvasToBlob(canvas, "image/png"), filenameFor(options, "png"));
    return;
  }

  const pdf = createPdfFromJpeg(canvas.toDataURL("image/jpeg", 0.92), canvas.width, canvas.height);
  downloadBlob(pdf, filenameFor(options, "pdf"));
}

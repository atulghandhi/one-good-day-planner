import type { CSSProperties } from "react";
import { depthLevel } from "./graph";
import type { ShapeKey, ShapeTheme, SketchMarker, SketchPalette } from "./types";

export const SKETCH_PALETTES: Record<string, SketchPalette> = {
  sakura: {
    paper: "#fff7f6",
    paperAccent: "rgba(204, 115, 159, 0.12)",
    card: "#fffdf9",
    ink: "#25151f",
    doodle: "#2f1828",
    marker: "#e8a4c8",
    markerDark: "#b96c9d",
    markerGlow: "rgba(232, 164, 200, 0.46)",
    ringHighlight: "rgba(255, 255, 255, 0.72)",
    line: "#2b1d25",
    shadow: "rgba(37, 21, 31, 0.14)",
    placeholder: "rgba(37, 21, 31, 0.48)",
    textShadow: "rgba(37, 21, 31, 0.24)",
    childMarkers: [
      {
        marker: "#e8a4c8",
        markerDark: "#b96c9d",
        markerGlow: "rgba(232, 164, 200, 0.46)",
        line: "#b96c9d",
      },
      {
        marker: "#c9b0ff",
        markerDark: "#7e63d8",
        markerGlow: "rgba(201, 176, 255, 0.38)",
        line: "#7e63d8",
      },
      {
        marker: "#f3b08f",
        markerDark: "#bb6a43",
        markerGlow: "rgba(243, 176, 143, 0.38)",
        line: "#bb6a43",
      },
      {
        marker: "#94d8b4",
        markerDark: "#529c78",
        markerGlow: "rgba(148, 216, 180, 0.38)",
        line: "#529c78",
      },
      {
        marker: "#f1d06c",
        markerDark: "#a77919",
        markerGlow: "rgba(241, 208, 108, 0.38)",
        line: "#a77919",
      },
    ],
  },
  blossom: {
    paper: "#fff8ef",
    paperAccent: "rgba(148, 216, 180, 0.11)",
    card: "#fffaf4",
    ink: "#171311",
    doodle: "#171311",
    marker: "#94d8b4",
    markerDark: "#62b98f",
    markerGlow: "rgba(148, 216, 180, 0.58)",
    ringHighlight: "rgba(255, 255, 255, 0.72)",
    line: "#24201c",
    shadow: "rgba(23, 19, 17, 0.14)",
    placeholder: "rgba(23, 19, 17, 0.45)",
    textShadow: "rgba(23, 19, 17, 0.22)",
    childMarkers: [
      {
        marker: "#94d8b4",
        markerDark: "#62b98f",
        markerGlow: "rgba(148, 216, 180, 0.58)",
        line: "#4f9f79",
      },
      {
        marker: "#ffb0a2",
        markerDark: "#cf6d58",
        markerGlow: "rgba(255, 176, 162, 0.42)",
        line: "#bf5f4d",
      },
      {
        marker: "#c6b7ff",
        markerDark: "#7f69dd",
        markerGlow: "rgba(198, 183, 255, 0.38)",
        line: "#715dc9",
      },
      {
        marker: "#f3d76c",
        markerDark: "#b28b19",
        markerGlow: "rgba(243, 215, 108, 0.38)",
        line: "#9c7914",
      },
      {
        marker: "#91d3ef",
        markerDark: "#3b8ab4",
        markerGlow: "rgba(145, 211, 239, 0.36)",
        line: "#33799f",
      },
    ],
  },
  meadow: {
    paper: "#fffbe8",
    paperAccent: "rgba(214, 166, 35, 0.13)",
    card: "#fffdf1",
    ink: "#242113",
    doodle: "#292310",
    marker: "#edcf69",
    markerDark: "#ad7f17",
    markerGlow: "rgba(237, 207, 105, 0.5)",
    ringHighlight: "rgba(255, 255, 255, 0.7)",
    line: "#302712",
    shadow: "rgba(48, 39, 18, 0.15)",
    placeholder: "rgba(36, 33, 19, 0.48)",
    textShadow: "rgba(48, 39, 18, 0.22)",
    childMarkers: [
      {
        marker: "#edcf69",
        markerDark: "#ad7f17",
        markerGlow: "rgba(237, 207, 105, 0.5)",
        line: "#9c7414",
      },
      {
        marker: "#9fd2ff",
        markerDark: "#457fb2",
        markerGlow: "rgba(159, 210, 255, 0.38)",
        line: "#3a719f",
      },
      {
        marker: "#f5a881",
        markerDark: "#ba653c",
        markerGlow: "rgba(245, 168, 129, 0.36)",
        line: "#a85a34",
      },
      {
        marker: "#aedf91",
        markerDark: "#679b42",
        markerGlow: "rgba(174, 223, 145, 0.38)",
        line: "#5c893b",
      },
      {
        marker: "#d7b0ff",
        markerDark: "#8b61c4",
        markerGlow: "rgba(215, 176, 255, 0.34)",
        line: "#7752ad",
      },
    ],
  },
  nebula: {
    paper: "#130d20",
    paperAccent: "rgba(245, 93, 199, 0.14)",
    card: "#21172f",
    ink: "#fff2ff",
    doodle: "#f5ddff",
    marker: "#ff6fcf",
    markerDark: "#65d6ff",
    markerGlow: "rgba(255, 111, 207, 0.36)",
    ringHighlight: "rgba(255, 255, 255, 0.28)",
    line: "#fff2ff",
    shadow: "rgba(0, 0, 0, 0.34)",
    placeholder: "rgba(255, 242, 255, 0.5)",
    textShadow: "rgba(0, 0, 0, 0.45)",
    childMarkers: [
      {
        marker: "#ff6fcf",
        markerDark: "#65d6ff",
        markerGlow: "rgba(255, 111, 207, 0.36)",
        line: "#ff95df",
      },
      {
        marker: "#65d6ff",
        markerDark: "#9c8cff",
        markerGlow: "rgba(101, 214, 255, 0.32)",
        line: "#9ee5ff",
      },
      {
        marker: "#ffe26e",
        markerDark: "#ff9bd7",
        markerGlow: "rgba(255, 226, 110, 0.28)",
        line: "#ffe88d",
      },
      {
        marker: "#b6ff8a",
        markerDark: "#65d6ff",
        markerGlow: "rgba(182, 255, 138, 0.26)",
        line: "#cbffa9",
      },
      {
        marker: "#c7a8ff",
        markerDark: "#ff6fcf",
        markerGlow: "rgba(199, 168, 255, 0.3)",
        line: "#d6bfff",
      },
    ],
  },
  forest: {
    paper: "#101912",
    paperAccent: "rgba(150, 205, 124, 0.12)",
    card: "#19251b",
    ink: "#f5efd7",
    doodle: "#efe7c9",
    marker: "#93cf82",
    markerDark: "#d0b565",
    markerGlow: "rgba(147, 207, 130, 0.32)",
    ringHighlight: "rgba(255, 245, 211, 0.24)",
    line: "#f5efd7",
    shadow: "rgba(0, 0, 0, 0.32)",
    placeholder: "rgba(245, 239, 215, 0.48)",
    textShadow: "rgba(0, 0, 0, 0.44)",
    childMarkers: [
      {
        marker: "#93cf82",
        markerDark: "#d0b565",
        markerGlow: "rgba(147, 207, 130, 0.32)",
        line: "#b8e4a6",
      },
      {
        marker: "#d0b565",
        markerDark: "#93cf82",
        markerGlow: "rgba(208, 181, 101, 0.3)",
        line: "#ead38a",
      },
      {
        marker: "#79c7a2",
        markerDark: "#c5dc85",
        markerGlow: "rgba(121, 199, 162, 0.28)",
        line: "#9fe2c0",
      },
      {
        marker: "#c5dc85",
        markerDark: "#8ebc5e",
        markerGlow: "rgba(197, 220, 133, 0.3)",
        line: "#d9ee9f",
      },
      {
        marker: "#e1a36c",
        markerDark: "#a8753f",
        markerGlow: "rgba(225, 163, 108, 0.28)",
        line: "#f0bc85",
      },
    ],
  },
  starry: {
    paper: "#0b1024",
    paperAccent: "rgba(126, 201, 255, 0.13)",
    card: "#151d35",
    ink: "#f0f7ff",
    doodle: "#e7f1ff",
    marker: "#7ec9ff",
    markerDark: "#b8a0ff",
    markerGlow: "rgba(126, 201, 255, 0.34)",
    ringHighlight: "rgba(255, 255, 255, 0.25)",
    line: "#f0f7ff",
    shadow: "rgba(0, 0, 0, 0.36)",
    placeholder: "rgba(240, 247, 255, 0.5)",
    textShadow: "rgba(0, 0, 0, 0.46)",
    childMarkers: [
      {
        marker: "#7ec9ff",
        markerDark: "#b8a0ff",
        markerGlow: "rgba(126, 201, 255, 0.34)",
        line: "#a5dcff",
      },
      {
        marker: "#b8a0ff",
        markerDark: "#7ec9ff",
        markerGlow: "rgba(184, 160, 255, 0.3)",
        line: "#c8b6ff",
      },
      {
        marker: "#ffe88d",
        markerDark: "#7ec9ff",
        markerGlow: "rgba(255, 232, 141, 0.25)",
        line: "#fff0a8",
      },
      {
        marker: "#8ef4d0",
        markerDark: "#7ec9ff",
        markerGlow: "rgba(142, 244, 208, 0.25)",
        line: "#a9ffe1",
      },
      {
        marker: "#ff9dd7",
        markerDark: "#b8a0ff",
        markerGlow: "rgba(255, 157, 215, 0.26)",
        line: "#ffbae3",
      },
    ],
  },
};

export function sketchMarkerForDepth(palette: SketchPalette, depth: number): SketchMarker {
  return palette.childMarkers[depthLevel(depth) % palette.childMarkers.length] ?? palette;
}

export function safeSvgId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export const SHAPE_THEMES: Record<ShapeKey, ShapeTheme> = {
  pill: {
    fontFamily:
      '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    cardClassName: "bg-card/90 shadow-soft backdrop-blur",
    controlClassName: "bg-card/70 shadow-soft backdrop-blur",
    lineMode: "curve",
  },
  boxy: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    cardClassName:
      "border-2 border-foreground/25 bg-card/95 shadow-[6px_6px_0_color-mix(in_oklab,var(--mit)_26%,transparent)]",
    controlClassName:
      "border-2 border-foreground/25 bg-card/90 shadow-[4px_4px_0_color-mix(in_oklab,var(--mit)_24%,transparent)]",
    lineMode: "orthogonal",
  },
  blob: {
    fontFamily:
      '"Marker Felt", "Chalkboard SE", "Comic Sans MS", "Bradley Hand", cursive, ui-sans-serif, system-ui, sans-serif',
    cardClassName: "shadow-[3px_4px_0_rgba(23,19,17,0.12)]",
    controlClassName: "border-2 shadow-[3px_4px_0_rgba(23,19,17,0.16)]",
    lineMode: "sketch",
  },
};

export function shapeStyle(shape: ShapeKey): CSSProperties {
  switch (shape) {
    case "pill":
      return { borderRadius: 9999 };
    case "boxy":
      return { borderRadius: 3 };
    case "blob":
      return {
        borderRadius: "58% 42% 54% 46% / 47% 57% 43% 53%",
      };
  }
}

export function controlStyle(
  shape: ShapeKey,
  theme: ShapeTheme,
  sketchPalette?: SketchPalette,
): CSSProperties {
  const base = {
    ...shapeStyle(shape),
    fontFamily: theme.fontFamily,
  };

  if (shape !== "blob" || !sketchPalette) return base;

  return {
    ...base,
    backgroundColor: sketchPalette.card,
    borderColor: sketchPalette.ink,
    boxShadow: `3px 4px 0 ${sketchPalette.shadow}`,
    color: sketchPalette.ink,
  };
}

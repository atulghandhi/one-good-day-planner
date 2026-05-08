import { WORLD_CENTER } from "./constants";
import type { CanvasView, ShapeTheme } from "./types";

export function toCanvasPoint(point: { x: number; y: number }) {
  return {
    x: WORLD_CENTER + point.x,
    y: WORLD_CENTER + point.y,
  };
}

export function toScreenPoint(point: { x: number; y: number }, view: CanvasView) {
  const canvasPoint = toCanvasPoint(point);
  return {
    x: view.x + canvasPoint.x * view.zoom,
    y: view.y + canvasPoint.y * view.zoom,
  };
}

export function connectorPathFromPoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
  mode: ShapeTheme["lineMode"],
  index: number,
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  if (mode === "orthogonal") {
    const bias = (index % 3) * 18 - 18;
    if (Math.abs(dx) > Math.abs(dy)) {
      const elbowX = start.x + dx * 0.52 + bias;
      return `M ${start.x} ${start.y} H ${elbowX} V ${end.y} H ${end.x}`;
    }
    const elbowY = start.y + dy * 0.52 + bias;
    return `M ${start.x} ${start.y} V ${elbowY} H ${end.x} V ${end.y}`;
  }

  if (mode === "sketch") {
    const curveAmt = Math.min(74, len * 0.22) * (index % 2 === 0 ? 1 : -1);
    const wobble = 12 + (index % 5) * 3.5;
    const c1x = start.x + dx * 0.28 + perpX * (curveAmt + wobble);
    const c1y = start.y + dy * 0.28 + perpY * (curveAmt + wobble * 0.6);
    const c2x = start.x + dx * 0.74 - perpX * (wobble * 0.85);
    const c2y = start.y + dy * 0.74 - perpY * wobble;
    return `M ${start.x} ${start.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${end.x} ${end.y}`;
  }

  const curveAmt = Math.min(70, len * 0.18) * (index % 2 === 0 ? 1 : -1);
  const mx = (start.x + end.x) / 2 + perpX * curveAmt;
  const my = (start.y + end.y) / 2 + perpY * curveAmt;
  return `M ${start.x} ${start.y} Q ${mx} ${my} ${end.x} ${end.y}`;
}

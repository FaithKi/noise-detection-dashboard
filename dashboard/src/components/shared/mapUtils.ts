/** Shared constants and utilities for noise map rendering */

export const CANVAS_W = 200;
export const CANVAS_H = 100;

/** Map a probability 0..1 to a green→red color */
export const probToColor = (p: number) => {
  const r = Math.round(34 + (255 - 34) * p);
  const g = Math.round(139 - 139 * p);
  const b = 0;
  return { r, g, b };
};

/** Inverse-distance weighting interpolation */
export const interpolateIDW = (
  x: number,
  y: number,
  points: { x: number; y: number; v: number }[],
  power = 2,
  eps = 1e-6
) => {
  let nom = 0;
  let denom = 0;
  for (const p of points) {
    const dx = x - p.x;
    const dy = y - p.y;
    const d2 = dx * dx + dy * dy + eps;
    const w = 1 / Math.pow(Math.sqrt(d2), power);
    nom += w * p.v;
    denom += w;
  }
  return denom ? nom / denom : 0;
};

/** Common device summary shape used by both history and real-time maps */
export type DeviceMapSummary = {
  device: string;
  p: number;
  count: number;
  online: boolean;
};

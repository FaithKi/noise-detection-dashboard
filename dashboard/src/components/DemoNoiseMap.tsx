import { useEffect, useRef } from "react";
import devices from "../config/devices";
import demoData from "../sample/sampleData";

const canvasW = 200;
const canvasH = 100;

const probToColor = (p: number) => {
  const r = Math.round(34 + (255 - 34) * p);
  const g = Math.round(139 - 139 * p);
  const b = 0;
  return { r, g, b };
};

const interpolateIDW = (
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

export default function DemoNoiseMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const summaries = devices.map((d) => {
      const arr = demoData[d.id] ?? [];
      const count = arr.length;
      const sum = arr.reduce((a, b) => a + b, 0);
      const p = count ? sum / count : 0;
      return { device: d.id, x: d.x, y: d.y, p, count };
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const points = summaries.map((s) => ({ x: s.x, y: s.y, v: s.p }));

    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let py = 0; py < canvas.height; py++) {
      for (let px = 0; px < canvas.width; px++) {
        const vx = (px / (canvas.width - 1)) * (canvasW - 1);
        const vy = (py / (canvas.height - 1)) * (canvasH - 1);
        const val = interpolateIDW(vx, vy, points, 2);
        const { r, g, b } = probToColor(val);
        const alpha = Math.round(180 * val);
        const idx = (py * canvas.width + px) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = alpha;
      }
    }
    ctx.putImageData(img, 0, 0);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${(rect.width * canvasH) / canvasW}px`;
    }
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 600 }} ref={containerRef}>
      <div style={{ position: "relative", width: "100%" }}>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto", borderRadius: 6 }} />

        <svg viewBox={`0 0 ${canvasW} ${canvasH}`} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {devices.map((d) => {
            const arr = demoData[d.id] ?? [];
            const count = arr.length;
            const p = count ? arr.reduce((a,b)=>a+b,0)/count : 0;
            const color = probToColor(p);
            const fill = `rgb(${color.r},${color.g},${color.b})`;
            const radius = 6 + Math.min(12, p * 20);
            const offline = count === 0 || arr.every((v) => v === 0);
            return (
              <g key={d.id}>
                {offline ? (
                  <circle cx={d.x} cy={d.y} r={radius} fill="none" stroke="#9ca3af" strokeWidth={1.5} />
                ) : (
                  <circle cx={d.x} cy={d.y} r={radius} fill={fill} stroke="#fff" strokeWidth={1} />
                )}
                <text x={d.x} y={d.y - radius - 4} fontSize={7} textAnchor="middle" fill="#111827">{d.id}</text>
                <title>{`${d.id}: ${(p*100).toFixed(0)}% noisy (${count} samples)${offline?" — offline/quiet":''}`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <div style={{ width: 16, height: 12, background: "rgb(34,139,0)" }} />
        <div style={{ fontSize: 12 }}>Quiet</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12 }}>Noisy</div>
        <div style={{ width: 16, height: 12, background: "rgb(255,0,0)" }} />
      </div>
    </div>
  );
}

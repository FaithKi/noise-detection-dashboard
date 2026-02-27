import { useEffect, useRef, useState } from "react";
import imageDevices from "../config/imageDevices";
import demoData from "../sample/sampleData";
import lib3 from "../assets/library3rdFloor.jpg";
import lib4 from "../assets/library4thFloor.jpg";

const viewW = 200;
const viewH = 100;

const probToColor = (p: number) => {
  const r = Math.round(34 + (255 - 34) * p);
  const g = Math.round(139 - 139 * p);
  return `rgb(${r},${g},0)`;
};

export default function ImageDemoMaps() {
  const containerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [showNames, setShowNames] = useState(false);
  const [opacityScale, setOpacityScale] = useState(0.45);

  useEffect(() => {
    // nothing to draw on mount for now; images and SVG overlays handle markers
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ color: "#e6eef8", fontSize: 13 }}>Quiet</div>
          <div style={{ width: 220, height: 12, borderRadius: 6, background: "linear-gradient(90deg, rgb(34,139,0), rgb(255,165,0), rgb(255,0,0))" }} />
          <div style={{ color: "#e6eef8", fontSize: 13 }}>Noisy</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" style={{ marginRight: 4 }} checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
            Show name
          </label>

          <label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            Opacity
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={opacityScale}
              onChange={(e) => setOpacityScale(Number(e.target.value))}
            />
            <span style={{ minWidth: 36, textAlign: "right" }}>{Math.round(opacityScale * 100)}%</span>
          </label>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
      {imageDevices.map((imgCfg, idx) => {
        const imgSrc = imgCfg.image.includes("3rd") ? lib3 : lib4;
        return (
          <div key={imgCfg.image} className="image-card" ref={(el) => (containerRefs.current[idx] = el)}>
            <div className="image-inner">
              <div style={{ position: "relative", width: "100%" }}>
                <img src={imgSrc} alt={imgCfg.image} style={{ display: "block", width: "100%", height: "auto" }} />

                <svg viewBox={`0 0 ${viewW} ${viewH}`} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              {imgCfg.devices.map((d) => {
                const arr = demoData[d.id] ?? [];
                const count = arr.length;
                const p = count ? arr.reduce((a,b)=>a+b,0)/count : 0;
                const offline = count === 0; // treat only zero-count as offline here
                const fill = probToColor(p);
                const radius = 6 + Math.min(12, p * 20);
                return (
                  <g key={d.id}>
                    {offline ? (
                      <g>
                        <circle cx={d.x} cy={d.y} r={radius + 3} fill="none" stroke="rgba(255,99,71,0.95)" strokeWidth={2} strokeDasharray="4 2" />
                        <circle cx={d.x} cy={d.y} r={Math.max(2, Math.round(radius / 3))} fill="rgba(255,99,71,0.95)" />
                        <line x1={d.x - radius / 2} y1={d.y - radius / 2} x2={d.x + radius / 2} y2={d.y + radius / 2} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
                        <line x1={d.x - radius / 2} y1={d.y + radius / 2} x2={d.x + radius / 2} y2={d.y - radius / 2} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
                      </g>
                    ) : (
                      <circle cx={d.x} cy={d.y} r={radius} fill={fill} fillOpacity={opacityScale} stroke="none" />
                    )}
                    {/* compact below-label removed; only show compact centered badge when enabled */}
                    {showNames ? (
                      <g>
                        <rect x={d.x - 17} y={d.y - 9} width={34} height={16} rx={6} fill={offline ? "rgba(75,85,99,0.45)" : "rgba(0,0,0,0.65)"} />
                        <text x={d.x} y={d.y} fontSize={8} textAnchor="middle" dominantBaseline="central" fill={offline ? "#e5e7eb" : "#ffffff"} fontWeight={700}>
                          {d.id}{offline ? " (offline)" : ""}
                        </text>
                      </g>
                    ) : null}
                    <title>{`${d.id}: ${(p*100).toFixed(0)}% noisy (${count} samples)${offline?" — offline (no samples)":''}`}</title>
                  </g>
                );
            })}
              </svg>
              </div>

              {imgCfg.label && <div className="image-label-below">{imgCfg.label}</div>}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

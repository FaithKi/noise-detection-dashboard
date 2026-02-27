import { probToColor, CANVAS_W, CANVAS_H } from "./mapUtils";
import type { DeviceMapSummary } from "./mapUtils";
import imageDevices from "../../config/imageDevices";
import lib3 from "../../assets/library3rdFloor.jpg";
import lib4 from "../../assets/library4thFloor.jpg";

type FloorMapOverlayProps = {
  summaries: DeviceMapSummary[];
  showNames: boolean;
  opacityScale: number;
  /** Show pulsing animation on online devices (used in real-time mode) */
  pulse?: boolean;
};

export default function FloorMapOverlay({ summaries, showNames, opacityScale, pulse = false }: FloorMapOverlayProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
      {imageDevices.map((imgCfg) => {
        const imgSrc = imgCfg.image.includes("3rd") ? lib3 : lib4;
        return (
          <div key={imgCfg.image} className="image-card">
            <div className="image-inner">
              <div style={{ position: "relative", width: "100%" }}>
                <img src={imgSrc} alt={imgCfg.image} style={{ display: "block", width: "100%", height: "auto" }} />

                <svg
                  viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                  style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                >
                  {imgCfg.devices.map((d) => {
                    const s = summaries.find((x) => x.device === d.id) ?? { device: d.id, p: 0, count: 0, online: false };
                    const p = s.p;
                    const offline = !s.online;
                    const color = probToColor(p);
                    const fill = `rgb(${color.r},${color.g},0)`;
                    const radius = 6 + Math.min(12, p * 20);
                    return (
                      <g key={d.id}>
                        {offline ? (
                          <OfflineMarker x={d.x} y={d.y} radius={radius} />
                        ) : (
                          <>
                            <circle cx={d.x} cy={d.y} r={radius} fill={fill} fillOpacity={opacityScale} stroke="none" />
                            {pulse && (
                              <circle cx={d.x} cy={d.y} r={radius + 2} fill="none" stroke={fill} strokeWidth={1} strokeOpacity={0.5}>
                                <animate attributeName="r" from={radius} to={radius + 8} dur="2s" repeatCount="indefinite" />
                                <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                              </circle>
                            )}
                          </>
                        )}
                        {showNames && (
                          <g>
                            <rect
                              x={d.x - (offline ? 30 : 20)}
                              y={d.y - 9}
                              width={offline ? 60 : 40}
                              height={16}
                              rx={6}
                              fill="rgba(0,0,0,0.65)"
                            />
                            <text
                              x={d.x} y={d.y} fontSize={8} textAnchor="middle"
                              dominantBaseline="central" fill={offline ? "#e5e7eb" : "#ffffff"} fontWeight={700}
                            >
                              {d.id}{offline ? " (offline)" : ""}
                            </text>
                          </g>
                        )}
                        <title>{`${d.id}: ${(p * 100).toFixed(0)}% noisy (${s.count} samples)${offline ? " — offline (no samples)" : ""}`}</title>
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
  );
}

/** Reusable offline marker (dashed ring + dot + X) */
function OfflineMarker({ x, y, radius }: { x: number; y: number; radius: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={radius + 3} fill="none" stroke="rgba(255,99,71,0.95)" strokeWidth={2} strokeDasharray="4 2" />
      <circle cx={x} cy={y} r={Math.max(2, Math.round(radius / 3))} fill="rgba(255,99,71,0.95)" />
      <line x1={x - radius / 2} y1={y - radius / 2} x2={x + radius / 2} y2={y + radius / 2} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
      <line x1={x - radius / 2} y1={y + radius / 2} x2={x + radius / 2} y2={y - radius / 2} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
    </g>
  );
}

import { useState, useRef } from "react";
import { useRealtimeDevices } from "../hooks/useRealtimeDevices";
import type { DeviceRealtimeStatus } from "../hooks/useRealtimeDevices";
import imageDevices from "../config/imageDevices";
import lib3 from "../assets/library3rdFloor.jpg";
import lib4 from "../assets/library4thFloor.jpg";

const canvasW = 200;
const canvasH = 100;

const probToColor = (p: number) => {
  const r = Math.round(34 + (255 - 34) * p);
  const g = Math.round(139 - 139 * p);
  const b = 0;
  return { r, g, b };
};

const statusLabel = (d: DeviceRealtimeStatus) => {
  if (!d.online) return "Offline";
  if (d.p >= 0.5) return "Loud";
  return "Quiet";
};

const statusColor = (d: DeviceRealtimeStatus) => {
  if (!d.online) return "#ff6347";
  if (d.p >= 0.5) return "#ff4444";
  return "#22c55e";
};

export default function RealtimeNoiseMap() {
  const [period, setPeriod] = useState("10m");
  const [showNames, setShowNames] = useState(true);
  const [opacityScale, setOpacityScale] = useState(0.45);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { devices, connected, lastUpdate } = useRealtimeDevices(period);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "72vh", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 640 }} ref={containerRef}>

        {/* Connection status */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: connected ? "#22c55e" : "#ff4444",
            boxShadow: connected ? "0 0 6px #22c55e" : "0 0 6px #ff4444",
          }} />
          <span style={{ color: "#e6eef8", fontSize: 13 }}>
            {connected ? "Connected — Real-time" : "Disconnected"}
          </span>
          {lastUpdate && (
            <span style={{ color: "#94a3b8", fontSize: 12, marginLeft: 8 }}>
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ color: "#e6eef8", fontSize: 13 }}>Quiet</div>
            <div style={{ width: 220, height: 12, borderRadius: 6, background: "linear-gradient(90deg, rgb(34,139,0), rgb(255,165,0), rgb(255,0,0))" }} />
            <div style={{ color: "#e6eef8", fontSize: 13 }}>Noisy</div>
          </div>

          {/* Period selector */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              Period
              <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ marginLeft: 8 }}>
                <option value="5m">5 minutes</option>
                <option value="10m">10 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
                <option value="6h">6 hours</option>
                <option value="24h">24 hours</option>
              </select>
            </label>
          </div>

          {/* Opacity + show names */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              Opacity
              <input type="range" min={0} max={1} step={0.05} value={opacityScale} onChange={(e) => setOpacityScale(Number(e.target.value))} />
              <span style={{ minWidth: 36, textAlign: "right" }}>{Math.round(opacityScale * 100)}%</span>
            </label>
            <label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" style={{ marginRight: 4 }} checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
              Show device name
            </label>
          </div>
        </div>

        {/* Device status cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
          {devices.map((d) => (
            <div key={d.device} style={{
              background: "#1e293b",
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              border: `1.5px solid ${d.online ? "rgba(34,197,94,0.3)" : "rgba(255,99,71,0.3)"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: statusColor(d),
                  boxShadow: `0 0 4px ${statusColor(d)}`,
                }} />
                <span style={{ color: "#e6eef8", fontWeight: 600, fontSize: 14 }}>{d.device}</span>
              </div>
              <div style={{ color: statusColor(d), fontWeight: 700, fontSize: 16 }}>
                {statusLabel(d)}
              </div>
              {d.online && (
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {(d.p * 100).toFixed(0)}% noisy · {d.count} samples
                </div>
              )}
              {!d.online && (
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {d.lastSeen
                    ? `Last seen: ${new Date(d.lastSeen).toLocaleTimeString()}`
                    : `No data in last ${period}`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Offline legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8 }}>
          <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
            <circle cx={12} cy={12} r={7} fill="none" stroke="rgba(255,99,71,0.95)" strokeWidth={2} strokeDasharray="4 2" />
            <circle cx={12} cy={12} r={2} fill="rgba(255,99,71,0.95)" />
            <line x1={8} y1={8} x2={16} y2={16} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
            <line x1={8} y1={16} x2={16} y2={8} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
          </svg>
          <div style={{ color: "#e6eef8", fontSize: 13 }}>Offline — no samples</div>
        </div>

        {/* Library floor maps */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 8 }}>Library Floor Maps — Real-time</h3>
          <div style={{ color: "#cfe8ff", fontSize: 13, marginBottom: 6 }}>
            Showing: Last {period} (auto-refreshes every 10s)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {imageDevices.map((imgCfg) => {
              const imgSrc = imgCfg.image.includes("3rd") ? lib3 : lib4;
              return (
                <div key={imgCfg.image} className="image-card">
                  <div className="image-inner">
                    <div style={{ position: "relative", width: "100%" }}>
                      <img src={imgSrc} alt={imgCfg.image} style={{ display: "block", width: "100%", height: "auto" }} />

                      <svg viewBox={`0 0 ${canvasW} ${canvasH}`} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                        {imgCfg.devices.map((d) => {
                          const s = devices.find((x) => x.device === d.id) ?? { device: d.id, p: 0, count: 0, online: false };
                          const p = s.p;
                          const offline = !s.online;
                          const color = probToColor(p);
                          const fill = `rgb(${color.r},${color.g},0)`;
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
                                <>
                                  <circle cx={d.x} cy={d.y} r={radius} fill={fill} fillOpacity={opacityScale} stroke="none" />
                                  {/* Pulsing ring for online devices */}
                                  <circle cx={d.x} cy={d.y} r={radius + 2} fill="none" stroke={fill} strokeWidth={1} strokeOpacity={0.5}>
                                    <animate attributeName="r" from={radius} to={radius + 8} dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                                  </circle>
                                </>
                              )}
                              {showNames ? (
                                <g>
                                  <rect
                                    x={d.x - (offline ? 30 : 20)}
                                    y={d.y - 9}
                                    width={offline ? 60 : 40}
                                    height={16}
                                    rx={6}
                                    fill="rgba(0,0,0,0.65)"
                                  />
                                  <text x={d.x} y={d.y} fontSize={8} textAnchor="middle" dominantBaseline="central" fill={offline ? "#e5e7eb" : "#ffffff"} fontWeight={700}>
                                    {d.id}{offline ? " (offline)" : ""}
                                  </text>
                                </g>
                              ) : null}
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
        </div>
      </div>
    </div>
  );
}

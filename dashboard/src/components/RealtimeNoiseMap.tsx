import { useState, useRef } from "react";
import { useRealtimeDevices } from "../hooks/useRealtimeDevices";
import type { DeviceRealtimeStatus } from "../hooks/useRealtimeDevices";
import FloorMapOverlay from "./shared/FloorMapOverlay";
import OfflineLegend from "./shared/OfflineLegend";
import NoiseLegend from "./shared/NoiseLegend";
import PeriodSelector from "./shared/PeriodSelector";
import MapControls from "./shared/MapControls";

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

  // Convert to shared DeviceMapSummary shape
  const summaries = devices.map((d) => ({
    device: d.device,
    p: d.p,
    count: d.count,
    online: d.online,
  }));

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
          <NoiseLegend />

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <PeriodSelector period={period} onChange={setPeriod} />
          </div>

          <MapControls
            opacityScale={opacityScale}
            onOpacityChange={setOpacityScale}
            showNames={showNames}
            onShowNamesChange={setShowNames}
          />
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

        <OfflineLegend />

        {/* Library floor maps */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 8 }}>Library Floor Maps — Real-time</h3>
          <div style={{ color: "#cfe8ff", fontSize: 13, marginBottom: 6 }}>
            Showing: Last {period} (auto-refreshes every 10s)
          </div>
          <FloorMapOverlay
            summaries={summaries}
            showNames={showNames}
            opacityScale={opacityScale}
            pulse
          />
        </div>
      </div>
    </div>
  );
}

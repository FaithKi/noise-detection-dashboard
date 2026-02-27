/** Offline legend icon with label */
export default function OfflineLegend() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8 }}>
      <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
        <circle cx={12} cy={12} r={7} fill="none" stroke="rgba(255,99,71,0.95)" strokeWidth={2} strokeDasharray="4 2" />
        <circle cx={12} cy={12} r={2} fill="rgba(255,99,71,0.95)" />
        <line x1={8} y1={8} x2={16} y2={16} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
        <line x1={8} y1={16} x2={16} y2={8} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
      </svg>
      <div style={{ color: "#e6eef8", fontSize: 13 }}>Offline — no samples</div>
    </div>
  );
}

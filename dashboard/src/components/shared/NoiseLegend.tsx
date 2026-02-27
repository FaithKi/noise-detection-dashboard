/** Quiet → Noisy gradient legend bar */
export default function NoiseLegend() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{ color: "#e6eef8", fontSize: 13 }}>Quiet</div>
      <div style={{ width: 220, height: 12, borderRadius: 6, background: "linear-gradient(90deg, rgb(34,139,0), rgb(255,165,0), rgb(255,0,0))" }} />
      <div style={{ color: "#e6eef8", fontSize: 13 }}>Noisy</div>
    </div>
  );
}

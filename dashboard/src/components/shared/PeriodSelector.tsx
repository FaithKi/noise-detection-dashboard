type PeriodSelectorProps = {
  period: string;
  onChange: (period: string) => void;
};

/** Reusable period dropdown (5m–24h) */
export default function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
      Period
      <select value={period} onChange={(e) => onChange(e.target.value)} style={{ marginLeft: 8 }}>
        <option value="5m">5 minutes</option>
        <option value="10m">10 minutes</option>
        <option value="30m">30 minutes</option>
        <option value="1h">1 hour</option>
        <option value="6h">6 hours</option>
        <option value="24h">24 hours</option>
      </select>
    </label>
  );
}

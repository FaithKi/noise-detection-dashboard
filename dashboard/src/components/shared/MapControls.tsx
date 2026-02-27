type MapControlsProps = {
  opacityScale: number;
  onOpacityChange: (v: number) => void;
  showNames: boolean;
  onShowNamesChange: (v: boolean) => void;
};

/** Opacity slider + show device name checkbox */
export default function MapControls({ opacityScale, onOpacityChange, showNames, onShowNamesChange }: MapControlsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
        Opacity
        <input type="range" min={0} max={1} step={0.05} value={opacityScale} onChange={(e) => onOpacityChange(Number(e.target.value))} />
        <span style={{ minWidth: 36, textAlign: "right" }}>{Math.round(opacityScale * 100)}%</span>
      </label>
      <label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" style={{ marginRight: 4 }} checked={showNames} onChange={(e) => onShowNamesChange(e.target.checked)} />
        Show device name
      </label>
    </div>
  );
}

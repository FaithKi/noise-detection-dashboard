import DemoNoiseMap from "../components/DemoNoiseMap";

export default function MapDemo() {
  return (
    <div style={{ padding: 16 }}>
      <h2>NoiseMap Demo</h2>
      <p>Sample data demonstrating the IDW heatmap and offline markers.</p>
      <DemoNoiseMap />
    </div>
  );
}

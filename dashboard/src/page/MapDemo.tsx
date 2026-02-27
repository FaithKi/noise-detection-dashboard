import DemoNoiseMap from "../components/DemoNoiseMap";
import ImageDemoMaps from "../components/ImageDemoMaps";

export default function MapDemo() {
  return (
    <div className="image-card">
      <div className="image-inner">
        <h2>NoiseMap Demo</h2>
        <p>Sample data demonstrating the IDW heatmap and offline markers.</p>
        <DemoNoiseMap />

        <hr style={{ margin: "16px 0", borderColor: "#334155" }} />

        <h3>Library Image Overlays</h3>
        <p>Two images with two devices each — edit positions in `src/config/imageDevices.ts`.</p>
        <ImageDemoMaps />
      </div>
    </div>
  );
}

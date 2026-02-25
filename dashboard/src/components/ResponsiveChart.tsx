import { ParentSize } from "@visx/responsive";
import LineChart from "./LineChart";

export default function ResponsiveChart({ data }) {
  return (
    <div style={{ width: "100%", height: 400 }}>
      <ParentSize>
        {({ width, height }) => (
          <LineChart
            data={data}
            width={width}
            height={height}
          />
        )}
      </ParentSize>
    </div>
  );
}

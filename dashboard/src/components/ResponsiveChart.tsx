import { ParentSize } from "@visx/responsive";
import LineChart from "./LineChart";

export default function ResponsiveChart({ data, series }) {
  return (
    <div style={{ width: "100%", height: 400 }}>
      <ParentSize>
        {({ width, height }) => (
          <LineChart
            data={data}
            series={series}
            width={width}
            height={height}
          />
        )}
      </ParentSize>
    </div>
  );
}

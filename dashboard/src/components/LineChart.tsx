import { scaleTime, scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { extent, max } from "d3-array";

type DataPoint = {
  time: Date;
  value: number;
};

type LineChartProps = {
  data: DataPoint[];
  width?: number;
  height?: number;
};

const formatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export default function LineChart({
  data,
  width = 700,
  height = 350,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return <div style={{ padding: 20 }}>No data</div>;
  }

  const margin = { top: 20, right: 20, bottom: 50, left: 60 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Safer domain calculation
  const xDomain = extent(data, (d) => d.time) as [Date, Date];
  const yDomain = [0, max(data, (d) => d.value) ?? 0];

  const xScale = scaleTime({
    domain: xDomain,
    range: [0, xMax],
  });

  const yScale = scaleLinear({
    domain: yDomain,
    range: [yMax, 0],
    nice: true,
  });

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {/* Line */}
        <LinePath<DataPoint>
          data={data}
          x={(d) => xScale(d.time)}
          y={(d) => yScale(d.value)}
          stroke="#FFA500"
          strokeWidth={2}
        />

        {/* X Axis */}
        <AxisBottom
          top={yMax}
          scale={xScale}
          numTicks={6}
          tickFormat={(d) => formatter.format(d as Date)}
          stroke="#FFFFFF"
          tickStroke="#FFFFFF"
          tickLabelProps={() => ({
            fill: "#9ca3af",   // 👈 text color
            fontSize: 12,
            textAnchor: "middle",
          })}
        />

        {/* Y Axis */}
        <AxisLeft
        	scale={yScale}
        	numTicks={5}
        	stroke="#FFFFFF"
        	tickStroke="#FFFFFF"
	        tickLabelProps={() => ({
	          fill: "#9ca3af",   // 👈 text color
	          fontSize: 12,
	          textAnchor: "end",
	        })}
        />
      </Group>
    </svg>
  );
}

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
  // either a single series via `data` or multiple series via `series`
  data?: DataPoint[];
  series?: { id: string; data: DataPoint[] }[];
  width: number;
  height: number;
};

const formatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export default function LineChart({
  data,
  series,
  width = 700,
  height = 350,
}: LineChartProps) {
  const hasSeries = Array.isArray(series) && series.length > 0;
  const singleData = !hasSeries ? data ?? [] : [];
  const anyDataPresent = (hasSeries && series!.some((s) => s.data && s.data.length > 0)) || (singleData && singleData.length > 0);
  if (!anyDataPresent) {
    return <div style={{ padding: 20 }}>No data</div>;
  }

  const margin = { top: 20, right: 20, bottom: 50, left: 60 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Safer domain calculation
  // compute domains across all series (or single data)
  const allPoints: DataPoint[] = hasSeries ? series!.flatMap((s) => s.data) : singleData;
  const xDomain = extent(allPoints, (d) => d.time) as [Date, Date];
  const yDomain = [0, max(allPoints, (d) => d.value) ?? 0];

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
    <div>
      <div>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Lines (single or multiple series) */}
          {hasSeries
            ? series!.map((s, i) => {
                const cols = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0", "#f032e6"];
                const stroke = cols[i % cols.length];
                return (
                  <LinePath<DataPoint>
                    key={s.id}
                    data={s.data}
                    x={(d) => xScale(d.time)}
                    y={(d) => yScale(d.value)}
                    stroke={stroke}
                    strokeWidth={2}
                  />
                );
              })
            : (
              <LinePath<DataPoint>
                data={singleData}
                x={(d) => xScale(d.time)}
                y={(d) => yScale(d.value)}
                stroke="#FFA500"
                strokeWidth={2}
              />
            )}

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
      {/* Legend below chart for multiple series */}
      {hasSeries ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingLeft: margin.left }}>
          {series!.map((s, i) => {
            const cols = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0", "#f032e6"];
            const stroke = cols[i % cols.length];
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 12, background: stroke, borderRadius: 3 }} />
                <div style={{ color: "#9ca3af", fontSize: 12 }}>{s.id}</div>
              </div>
            );
          })}
        </div>
      ) : null}
      </div>
    </div>
  );
}


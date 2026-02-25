import React from "react";
import { scaleTime, scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";

export default function LineChart({ data }) {
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // X scale (time)
  const xScale = scaleTime({
    domain: [
      Math.min(...data.map(d => d.time)),
      Math.max(...data.map(d => d.time))
    ],
    range: [0, xMax],
  });

  // Y scale (values)
  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map(d => d.value))],
    range: [yMax, 0],
    nice: true,
  });

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>

        {/* Line */}
        <LinePath
          data={data}
          x={d => xScale(d.time)}
          y={d => yScale(d.value)}
          stroke="#3b82f6"
          strokeWidth={2}
          curve={null}
        />

        {/* Axes */}
        <AxisBottom
          top={yMax}
          scale={xScale}
          numTicks={5}
        />

        <AxisLeft
          scale={yScale}
          numTicks={5}
        />

      </Group>
    </svg>
  );
}

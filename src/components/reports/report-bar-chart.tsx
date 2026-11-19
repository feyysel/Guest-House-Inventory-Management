"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDatum = Record<string, string | number>;

type ReportBarChartProps = {
  data: ChartDatum[];
  xDataKey: string;
  barDataKey: string;
  barName: string;
  color: string;
  height: number;
  tickFormatter?: (value: string) => string;
  tooltipFormatter?: (value: number) => string;
  yTickFormatter?: (value: number) => string;
  labelPrefix?: string;
  allowDecimals?: boolean;
};

export default function ReportBarChart({
  data,
  xDataKey,
  barDataKey,
  barName,
  color,
  height,
  tickFormatter,
  tooltipFormatter,
  yTickFormatter,
  labelPrefix,
  allowDecimals = true,
}: ReportBarChartProps) {
  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xDataKey} tickFormatter={tickFormatter} />
          <YAxis
            allowDecimals={allowDecimals}
            tickFormatter={(value: number) =>
              yTickFormatter ? yTickFormatter(value) : value.toLocaleString()
            }
          />
          <Tooltip
            formatter={(value) =>
              tooltipFormatter
                ? tooltipFormatter(Number(value))
                : Number(value).toLocaleString()
            }
            labelFormatter={labelPrefix ? (label) => `${labelPrefix}${label}` : undefined}
          />
          <Bar
            dataKey={barDataKey}
            name={barName}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

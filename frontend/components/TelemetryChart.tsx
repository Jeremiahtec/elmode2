// components/TelemetryChart.tsx
"use client";

import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import type { ChartPoint, TelemetryMetricType } from "@/types/telemetry";
import { METRIC_DISPLAY, STATUS_COLOR } from "@/lib/metricDisplay";
import type { DegradationStatus } from "@/types/telemetry";

export function TelemetryChart({
  metric,
  data,
  currentStatus,
}: {
  metric: TelemetryMetricType;
  data: ChartPoint[];
  currentStatus?: DegradationStatus;
}) {
  const meta = METRIC_DISPLAY[metric];
  const lineColor = currentStatus ? STATUS_COLOR[currentStatus] : "#4a5865";

  return (
    <div className="border-t border-graphite-800 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">{meta.label}</div>
        <div className="font-mono text-[10px] text-graphite-600">{meta.unit}</div>
      </div>

      <div className="h-32">
        {data.length < 2 ? (
          <div className="flex h-full items-center justify-center font-mono text-[11px] text-graphite-700">— —</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "#141a20",
                  border: "1px solid #333f4c",
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
                labelFormatter={() => ""}
                formatter={(value: number) => [`${value} ${meta.unit}`, meta.label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

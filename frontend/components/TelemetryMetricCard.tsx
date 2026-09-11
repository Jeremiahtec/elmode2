// components/TelemetryMetricCard.tsx
import type { TelemetryBroadcastMessage, TelemetryMetricType } from "@/types/telemetry";
import { METRIC_DISPLAY, formatValue } from "@/lib/metricDisplay";
import { StatusBadge } from "./StatusBadge";

export function TelemetryMetricCard({
  metric,
  reading,
}: {
  metric: TelemetryMetricType;
  reading: TelemetryBroadcastMessage | undefined;
}) {
  const meta = METRIC_DISPLAY[metric];

  return (
    <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-graphite-500">{meta.label}</div>
        {reading ? <StatusBadge status={reading.status} /> : null}
      </div>

      {reading ? (
        <>
          <div className="font-mono text-3xl font-bold tabular text-white">
            {formatValue(reading.value, meta.precision)}
            <span className="ml-1 text-base text-graphite-500">{meta.unit}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-graphite-500">Normal: {meta.safeRange}</div>
        </>
      ) : (
        <div className="py-2 font-mono text-sm text-graphite-500">Waiting for telemetry...</div>
      )}
    </div>
  );
}

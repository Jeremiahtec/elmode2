// components/TelemetryReadout.tsx
import type { TelemetryBroadcastMessage, TelemetryMetricType } from "@/types/telemetry";
import { METRIC_DISPLAY, formatValue, STATUS_COLOR } from "@/lib/metricDisplay";

/**
 * Instrument-cluster-style readout: large dominant value, compact label
 * above, status bar below — replaces the old floating rounded card per
 * metric. Designed to sit in an open list, separated by thin dividers,
 * not individually boxed.
 */
export function TelemetryReadout({
  metric,
  reading,
}: {
  metric: TelemetryMetricType;
  reading: TelemetryBroadcastMessage | undefined;
}) {
  const meta = METRIC_DISPLAY[metric];
  const color = reading ? STATUS_COLOR[reading.status] : "#5a6570";

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">{meta.label}</div>
        {reading ? (
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold tabular-nums text-white">
              {formatValue(reading.value, meta.precision)}
            </span>
            <span className="font-mono text-xs text-graphite-500">{meta.unit}</span>
          </div>
        ) : (
          <div className="font-mono text-sm text-graphite-600">— —</div>
        )}
        <div className="mt-0.5 font-mono text-[10px] text-graphite-600">Normal: {meta.safeRange}</div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${reading?.status === "CRITICAL" ? "pulse-critical" : ""}`}
          style={{ backgroundColor: color, boxShadow: reading ? `0 0 8px 0 ${color}80` : "none" }}
        />
      </div>
    </div>
  );
}

// components/VehicleHealthCard.tsx
import type { VehicleHealthSnapshot } from "@/types/diagnostics";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/metricDisplay";

export function VehicleHealthCard({ diagnostics }: { diagnostics: VehicleHealthSnapshot | null }) {
  if (!diagnostics) {
    return (
      <div className="flex flex-col justify-between rounded-lg border border-graphite-700 bg-graphite-900 p-6">
        <div className="text-[11px] uppercase tracking-wider text-graphite-500">Vehicle Health</div>
        <div className="py-8 text-center font-mono text-sm text-graphite-500">No diagnostic data yet.</div>
      </div>
    );
  }

  const color = STATUS_COLOR[diagnostics.overallStatus];

  return (
    <div className="flex flex-col justify-between rounded-lg border border-graphite-700 bg-graphite-900 p-6">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-graphite-500">Vehicle Health</div>
        <div className="font-mono text-[10px] text-graphite-500">{diagnostics.nodeId}</div>
      </div>

      <div className="flex items-end gap-4 py-2">
        <div className="font-mono text-6xl font-bold tabular" style={{ color }}>
          {diagnostics.overallHealthPercent}
          <span className="text-2xl text-graphite-500">%</span>
        </div>
        <div
          className={`mb-3 rounded border px-3 py-1 font-mono text-sm font-semibold tracking-wider ${
            diagnostics.overallStatus === "CRITICAL" ? "pulse-critical" : ""
          }`}
          style={{ color, borderColor: `${color}55`, backgroundColor: `${color}18` }}
        >
          {STATUS_LABEL[diagnostics.overallStatus]}
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${diagnostics.overallHealthPercent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

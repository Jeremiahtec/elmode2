// components/ComponentHealthCard.tsx
import type { ComponentDiagnosis } from "@/types/diagnostics";
import { COMPONENT_DISPLAY_NAMES } from "@/types/diagnostics";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/metricDisplay";

export function ComponentHealthCard({ diagnosis }: { diagnosis: ComponentDiagnosis }) {
  const color = STATUS_COLOR[diagnosis.status];

  return (
    <div
      className={`rounded-lg border bg-graphite-900 p-4 transition-colors ${
        diagnosis.status === "CRITICAL" ? "border-status-critical/40" : "border-graphite-700"
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="text-sm font-semibold text-white">{COMPONENT_DISPLAY_NAMES[diagnosis.component]}</div>
        <div
          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${
            diagnosis.status === "CRITICAL" ? "pulse-critical" : ""
          }`}
          style={{ color, borderColor: `${color}55`, backgroundColor: `${color}18` }}
        >
          {STATUS_LABEL[diagnosis.status]}
        </div>
      </div>

      <div className="mb-2 font-mono text-3xl font-bold tabular" style={{ color }}>
        {diagnosis.healthPercent}
        <span className="text-lg text-graphite-500">%</span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-graphite-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${diagnosis.healthPercent}%`, backgroundColor: color }}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-graphite-500">{diagnosis.detectedIssue}</p>
    </div>
  );
}

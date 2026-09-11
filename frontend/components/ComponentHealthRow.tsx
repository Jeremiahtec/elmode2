// components/ComponentHealthRow.tsx
import type { ComponentDiagnosis } from "@/types/diagnostics";
import { COMPONENT_DISPLAY_NAMES } from "@/types/diagnostics";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/metricDisplay";

export function ComponentHealthRow({ diagnosis }: { diagnosis: ComponentDiagnosis }) {
  const color = STATUS_COLOR[diagnosis.status];
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-40 shrink-0 text-[13px] text-graphite-200">{COMPONENT_DISPLAY_NAMES[diagnosis.component]}</div>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-graphite-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${diagnosis.healthPercent}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-12 shrink-0 text-right font-mono text-[13px] tabular-nums text-graphite-200">
        {diagnosis.healthPercent}%
      </div>
      <div
        className={`w-20 shrink-0 text-right font-mono text-[10px] font-semibold uppercase tracking-wider ${
          diagnosis.status === "CRITICAL" ? "pulse-critical" : ""
        }`}
        style={{ color }}
      >
        {STATUS_LABEL[diagnosis.status]}
      </div>
    </div>
  );
}

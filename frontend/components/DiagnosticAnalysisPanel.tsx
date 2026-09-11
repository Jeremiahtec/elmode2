// components/DiagnosticAnalysisPanel.tsx
import type { VehicleHealthSnapshot } from "@/types/diagnostics";
import { COMPONENT_DISPLAY_NAMES } from "@/types/diagnostics";
import { STATUS_COLOR, STATUS_LABEL, formatValue } from "@/lib/metricDisplay";

/**
 * Shows full diagnostic reasoning for every non-HEALTHY component, using
 * only fields that exist on ComponentDiagnosis (see backend record) —
 * no frontend-invented conclusions, per brief section 5.
 */
export function DiagnosticAnalysisPanel({ diagnostics }: { diagnostics: VehicleHealthSnapshot | null }) {
  if (!diagnostics) {
    return (
      <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-6">
        <div className="mb-1 text-[11px] uppercase tracking-wider text-graphite-500">Diagnostic Analysis</div>
        <div className="py-6 text-center font-mono text-sm text-graphite-500">No diagnostic data...</div>
      </div>
    );
  }

  const flagged = diagnostics.components.filter((c) => c.status !== "INFO");

  if (flagged.length === 0) {
    return (
      <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-6">
        <div className="mb-1 text-[11px] uppercase tracking-wider text-graphite-500">Diagnostic Analysis</div>
        <div className="py-6 text-center font-mono text-sm text-status-healthy">
          All systems operating within normal parameters.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-6">
      <div className="mb-4 text-[11px] uppercase tracking-wider text-graphite-500">Diagnostic Analysis</div>
      <div className="space-y-4">
        {flagged.map((c) => {
          const color = STATUS_COLOR[c.status];
          return (
            <div
              key={c.component}
              className="rounded-md border p-4"
              style={{ borderColor: `${color}40`, backgroundColor: `${color}0a` }}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-sm font-semibold text-white">
                  {COMPONENT_DISPLAY_NAMES[c.component]}
                </div>
                <div
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${
                    c.status === "CRITICAL" ? "pulse-critical" : ""
                  }`}
                  style={{ color, borderColor: `${color}55`, backgroundColor: `${color}18` }}
                >
                  {STATUS_LABEL[c.status]}
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-2">
                <div>
                  <div className="text-graphite-500">Observed</div>
                  <div className="text-white">{formatValue(c.observedValue, 1)} {c.observedUnit}</div>
                </div>
                <div>
                  <div className="text-graphite-500">Safe Range</div>
                  <div className="text-white">{c.safeRangeDescription}</div>
                </div>
              </div>

              <div className="mb-2">
                <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-graphite-500">Diagnosis</div>
                <div className="text-sm text-base-100">{c.detectedIssue}</div>
              </div>

              <div>
                <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-graphite-500">
                  Recommended Action
                </div>
                <div className="text-sm text-base-100">{c.recommendedAction}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// app/diagnostics/page.tsx
"use client";

import { useState } from "react";
import { useElmodeStream } from "@/hooks/useElmodeStream";
import { useVehicleHighlights } from "@/hooks/useVehicleHighlights";
import { useRouteOrientation } from "@/hooks/useRouteOrientation";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { VehicleScene } from "@/components/vehicle3d/VehicleScene";
import { COMPONENT_DISPLAY_NAMES, type ComponentDiagnosis } from "@/types/diagnostics";
import { STATUS_COLOR, formatValue } from "@/lib/metricDisplay";

function ComponentTab({
  diagnosis,
  active,
  onClick,
}: {
  diagnosis: ComponentDiagnosis;
  active: boolean;
  onClick: () => void;
}) {
  const color = STATUS_COLOR[diagnosis.status];
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between border-l-2 px-4 py-3 text-left transition-colors ${
        active ? "border-accent bg-graphite-850" : "border-transparent hover:bg-graphite-850/50"
      }`}
    >
      <span className={`text-[13px] ${active ? "text-white" : "text-graphite-400"}`}>
        {COMPONENT_DISPLAY_NAMES[diagnosis.component]}
      </span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[12px] tabular-nums text-graphite-500">{diagnosis.healthPercent}%</span>
        <span className={`h-1.5 w-1.5 rounded-full ${diagnosis.status === "CRITICAL" ? "pulse-critical" : ""}`} style={{ backgroundColor: color }} />
      </span>
    </button>
  );
}

function DiagnosticsContent() {
  const { diagnostics, connectionStatus, isTelemetryStale } = useElmodeStream();
  const highlights = useVehicleHighlights(diagnostics);
  const orientation = useRouteOrientation();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const components = diagnostics?.components ?? [];
  // Default selection: the worst-affected component, or the first one if all healthy.
  const active =
    components.find((c) => c.component === selectedComponent) ??
    components.find((c) => c.status === "CRITICAL") ??
    components.find((c) => c.status === "WARNING") ??
    components[0];

  const color = active ? STATUS_COLOR[active.status] : "#5a6570";

  return (
    <AppShell connectionStatus={connectionStatus}>
      <ConnectionBanner status={connectionStatus} isStale={isTelemetryStale} />

      <div className="border-b border-graphite-700 px-8 py-4">
        <span className="text-sm font-semibold text-white">Diagnostics</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_400px]">
        <div className="h-[380px] border-b border-graphite-700 lg:h-auto lg:border-b-0 lg:border-r">
          <VehicleScene orientation={orientation} highlights={highlights} />
        </div>

        <div className="border-b border-graphite-700 py-2 lg:border-b-0 lg:border-r">
          {components.length === 0 ? (
            <div className="px-4 py-6 font-mono text-xs text-graphite-600">No diagnostic data...</div>
          ) : (
            components.map((c) => (
              <ComponentTab
                key={c.component}
                diagnosis={c}
                active={active?.component === c.component}
                onClick={() => setSelectedComponent(c.component)}
              />
            ))
          )}
        </div>

        <div className="p-6">
          {!active ? (
            <div className="font-mono text-xs text-graphite-600">—</div>
          ) : (
            <div>
              <div className="mb-1 text-base font-semibold text-white">{COMPONENT_DISPLAY_NAMES[active.component]}</div>
              <div
                className={`mb-5 font-mono text-xs font-semibold uppercase tracking-widest2 ${
                  active.status === "CRITICAL" ? "pulse-critical" : ""
                }`}
                style={{ color }}
              >
                {active.status}
              </div>

              <div className="mb-5 flex items-baseline gap-8">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Observed</div>
                  <div className="font-mono text-2xl font-bold tabular-nums" style={{ color }}>
                    {formatValue(active.observedValue, 1)} {active.observedUnit}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Safe Range</div>
                  <div className="font-mono text-2xl font-semibold text-graphite-300">{active.safeRangeDescription}</div>
                </div>
              </div>

              <div className="border-t border-graphite-800 pt-4">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">
                  Fault Detected
                </div>
                <p className="text-[13px] leading-relaxed text-graphite-200">{active.detectedIssue}</p>
              </div>

              <div className="mt-4 border-t border-graphite-800 pt-4">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">
                  Recommended Action
                </div>
                <p className="text-[13px] leading-relaxed text-graphite-200">{active.recommendedAction}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function DiagnosticsPage() {
  return (
    <RequireAuth>
      <DiagnosticsContent />
    </RequireAuth>
  );
}

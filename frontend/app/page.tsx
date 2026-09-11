// app/page.tsx
"use client";

import Link from "next/link";
import { useElmodeStream } from "@/hooks/useElmodeStream";
import { useMergedTimeline } from "@/hooks/useMergedTimeline";
import { useVehicleHighlights } from "@/hooks/useVehicleHighlights";
import { useRouteOrientation } from "@/hooks/useRouteOrientation";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { VehicleScene } from "@/components/vehicle3d/VehicleScene";
import { CoolantGauge, OilPressureGauge, BatteryIndicator, HealthRing } from "@/components/gauges/InstrumentGauges";
import { STATUS_COLOR } from "@/lib/metricDisplay";

function DashboardContent() {
  const { telemetry, diagnostics, connectionStatus, isTelemetryStale, events, isHydrated } = useElmodeStream();
  const timeline = useMergedTimeline(events);
  const highlights = useVehicleHighlights(diagnostics);
  const orientation = useRouteOrientation();

  const hasTelemetry = Object.keys(telemetry).length > 0;
  const flaggedComponent = diagnostics?.components.find((c) => c.status !== "INFO");
  const recentEvents = [...timeline].reverse().slice(0, 4);

  return (
    <AppShell connectionStatus={connectionStatus} engineRunning={hasTelemetry && !isTelemetryStale}>
      <ConnectionBanner status={connectionStatus} isStale={isTelemetryStale} />

      {/* --- Identity strip --- */}
      <div className="flex items-center justify-between border-b border-graphite-700 px-8 py-4">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold text-white">Simulated Test Vehicle</span>
          <span className="font-mono text-[11px] text-graphite-600">VEH-001</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider">
          <span className={`flex items-center gap-1.5 ${connectionStatus === "connected" ? "text-status-healthy" : "text-graphite-500"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {connectionStatus === "connected" ? "CONNECTED" : "OFFLINE"}
          </span>
          {hasTelemetry && !isTelemetryStale && <span className="text-graphite-500">ENGINE RUNNING</span>}
        </div>
      </div>

      {!isHydrated ? (
        <div className="flex h-[70vh] items-center justify-center font-mono text-xs uppercase tracking-widest2 text-graphite-600">
          Connecting...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px]">
          {/* --- Vehicle stage: the dominant visual element --- */}
          <div className="relative">
            <div className="h-[62vh] min-h-[420px] border-b border-graphite-700 xl:border-b-0 xl:border-r">
              <VehicleScene orientation={orientation} highlights={highlights} />
            </div>

            {!hasTelemetry && (
              <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3">
                <div className="font-mono text-[11px] uppercase tracking-wider text-graphite-600">
                  SIMULATION STOPPED
                </div>
                <Link
                  href="/simulator"
                  className="rounded-md border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-accent hover:bg-accent/20"
                >
                  Open Simulator →
                </Link>
              </div>
            )}

            {/* --- Overlay: minimal telemetry strip beneath the vehicle --- */}
            {hasTelemetry && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-b border-graphite-700 px-8 py-5 sm:grid-cols-4 xl:border-b-0">
                <CoolantGauge value={telemetry.COOLANT_TEMP?.value} status={telemetry.COOLANT_TEMP?.status} />
                <OilPressureGauge value={telemetry.OIL_PRESSURE?.value} status={telemetry.OIL_PRESSURE?.status} />
                <BatteryIndicator value={telemetry.BATTERY_VOLTAGE?.value} status={telemetry.BATTERY_VOLTAGE?.status} />
                <div className="flex flex-col justify-center">
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Engine Load</div>
                  <div className="font-mono text-2xl font-semibold tabular-nums text-white">
                    {telemetry.ENGINE_LOAD ? `${telemetry.ENGINE_LOAD.value.toFixed(0)}%` : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- Right rail: health ring + faults --- */}
          <div className="flex flex-col border-t border-graphite-700 xl:border-t-0">
            <div className="flex flex-col items-center border-b border-graphite-700 px-6 py-8">
              <HealthRing percent={diagnostics?.overallHealthPercent} status={diagnostics?.overallStatus} />
            </div>

            <div className="border-b border-graphite-700 px-6 py-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest2 text-graphite-500">
                FAULTS
              </div>
              {!diagnostics || diagnostics.components.every((c) => c.status === "INFO") ? (
                <div className="font-mono text-[12px] text-status-healthy">NO ACTIVE FAULTS</div>
              ) : (
                <div className="space-y-2.5">
                  {diagnostics.components
                    .filter((c) => c.status !== "INFO")
                    .map((c) => (
                      <div key={c.component} className="flex items-center justify-between">
                        <span className="text-[12px] text-graphite-200">{c.component.replace(/_/g, " ")}</span>
                        <span
                          className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${
                            c.status === "CRITICAL" ? "pulse-critical" : ""
                          }`}
                          style={{ color: STATUS_COLOR[c.status] }}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
              {flaggedComponent && (
                <Link href="/diagnostics" className="mt-3 inline-block font-mono text-[11px] text-accent hover:underline">
                  View diagnostics →
                </Link>
              )}
            </div>

            <div className="flex-1 px-6 py-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest2 text-graphite-500">
                LAST EVENT
              </div>
              {recentEvents.length === 0 ? (
                <div className="font-mono text-[12px] text-graphite-600">—</div>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((e) => (
                    <div key={e.id} className="border-l-2 border-graphite-700 pl-3">
                      <div className="font-mono text-[10px] text-graphite-600">
                        {new Date(e.timestamp).toLocaleTimeString(undefined, { hour12: false })}
                      </div>
                      <div className="text-[12px] text-graphite-300">{e.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

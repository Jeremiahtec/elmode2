// app/telemetry/page.tsx
"use client";

import { useElmodeStream } from "@/hooks/useElmodeStream";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { RpmGauge, CoolantGauge, OilPressureGauge, BatteryIndicator } from "@/components/gauges/InstrumentGauges";
import { TelemetryChart } from "@/components/TelemetryChart";
import type { TelemetryMetricType } from "@/types/telemetry";

function TelemetryContent() {
  const { telemetry, telemetryHistory, connectionStatus, isTelemetryStale } = useElmodeStream();

  return (
    <AppShell connectionStatus={connectionStatus}>
      <ConnectionBanner status={connectionStatus} isStale={isTelemetryStale} />

      <div className="flex items-center justify-between border-b border-graphite-700 px-8 py-4">
        <span className="text-sm font-semibold text-white">Live Telemetry</span>
        <span className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${connectionStatus === "connected" ? "text-status-healthy" : "text-graphite-500"}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {connectionStatus === "connected" ? "LIVE" : "DOWN"}
        </span>
      </div>

      <div className="p-8">
        {/* --- Instrument cluster: RPM dominant, others secondary --- */}
        <div className="mb-10 grid grid-cols-1 gap-10 lg:grid-cols-[auto_1fr]">
          <RpmGauge value={telemetry.ENGINE_RPM?.value} status={telemetry.ENGINE_RPM?.status} />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <CoolantGauge value={telemetry.COOLANT_TEMP?.value} status={telemetry.COOLANT_TEMP?.status} />
            <OilPressureGauge value={telemetry.OIL_PRESSURE?.value} status={telemetry.OIL_PRESSURE?.status} />
            <BatteryIndicator value={telemetry.BATTERY_VOLTAGE?.value} status={telemetry.BATTERY_VOLTAGE?.status} />
          </div>
        </div>

        {/* --- Engine load: simple bar, no gauge needed --- */}
        <div className="mb-10 border-t border-graphite-800 pt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Engine Load</span>
            <span className="font-mono text-sm text-white">{telemetry.ENGINE_LOAD ? `${telemetry.ENGINE_LOAD.value.toFixed(0)}%` : "—"}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite-800">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${telemetry.ENGINE_LOAD?.value ?? 0}%` }}
            />
          </div>
        </div>

        {/* --- Historical traces --- */}
        <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest2 text-graphite-500">
          Trace History
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(["ENGINE_RPM", "COOLANT_TEMP", "OIL_PRESSURE", "BATTERY_VOLTAGE"] as TelemetryMetricType[]).map((metric) => (
            <TelemetryChart
              key={metric}
              metric={metric}
              data={telemetryHistory[metric]}
              currentStatus={telemetry[metric]?.status}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function TelemetryPage() {
  return (
    <RequireAuth>
      <TelemetryContent />
    </RequireAuth>
  );
}

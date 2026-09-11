// app/simulator/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useElmodeStream } from "@/hooks/useElmodeStream";
import { useVehicleHighlights } from "@/hooks/useVehicleHighlights";
import { useRouteOrientation } from "@/hooks/useRouteOrientation";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { VehicleScene } from "@/components/vehicle3d/VehicleScene";
import { EngineToggle } from "@/components/EngineToggle";
import { ScenarioSelector } from "@/components/ScenarioSelector";
import { SpeedSelector } from "@/components/SpeedSelector";
import { ManualOverridePanel } from "@/components/ManualOverridePanel";
import {
  getSimulationStatus,
  startEngine,
  stopEngine,
  selectScenario as apiSelectScenario,
  setSimulationSpeed,
  resetSimulation,
  BackendUnreachableError,
} from "@/lib/api";
import { logLifecycleEvent } from "@/lib/eventLog";
import type { SimulationScenario } from "@/types/simulation";
import { SCENARIO_LABELS } from "@/types/simulation";
import type { TelemetryMetricType } from "@/types/telemetry";

async function postOverride(metric: TelemetryMetricType, value: number | null) {
  const base = process.env.NEXT_PUBLIC_ELMODE_API_URL ?? "http://localhost:8080";
  await fetch(`${base}/api/simulation/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metric, value }),
  });
}
async function postClearAllOverrides() {
  const base = process.env.NEXT_PUBLIC_ELMODE_API_URL ?? "http://localhost:8080";
  await fetch(`${base}/api/simulation/override/clear-all`, { method: "POST" });
}

function SimulatorContent() {
  const { diagnostics, connectionStatus } = useElmodeStream();
  const highlights = useVehicleHighlights(diagnostics);
  const orientation = useRouteOrientation();

  const [engineRunning, setEngineRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);
  const [activeSpeed, setActiveSpeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await getSimulationStatus();
      setEngineRunning(status.engineRunning);
      setActiveScenario(status.activeScenario);
      setStatusError(status.mockModeAvailable ? null : "Backend not in mock mode — controls disabled.");
    } catch (err) {
      if (err instanceof BackendUnreachableError) setStatusError("Cannot reach backend.");
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const runAction = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);
      try {
        await action();
        await refreshStatus();
      } catch (err) {
        console.error("[Simulator] action failed:", err);
      } finally {
        setBusy(false);
      }
    },
    [refreshStatus]
  );

  const handleStart = () =>
    runAction(async () => {
      await startEngine();
      setEngineRunning(true);
      logLifecycleEvent("Engine started");
    });

  const handleStop = () =>
    runAction(async () => {
      await stopEngine();
      setEngineRunning(false);
      logLifecycleEvent("Engine stopped");
    });

  const handleReset = () =>
    runAction(async () => {
      await resetSimulation();
      setEngineRunning(false);
      setActiveScenario("HEALTHY");
      setActiveSpeed(1);
      logLifecycleEvent("Simulation reset");
    });

  const handleScenario = (scenario: SimulationScenario) =>
    runAction(async () => {
      await apiSelectScenario(scenario);
      setActiveScenario(scenario);
      logLifecycleEvent(`Scenario: ${SCENARIO_LABELS[scenario]}`);
    });

  const handleSpeed = (speed: number) =>
    runAction(async () => {
      await setSimulationSpeed(speed);
      setActiveSpeed(speed);
      logLifecycleEvent(`Speed set to ${speed}×`);
    });

  const handleOverrideSet = (metric: TelemetryMetricType, value: number) => {
    postOverride(metric, value).catch((e) => console.error(e));
  };
  const handleOverrideClear = (metric: TelemetryMetricType) => {
    postOverride(metric, null).catch((e) => console.error(e));
  };
  const handleClearAll = () => {
    postClearAllOverrides().catch((e) => console.error(e));
  };

  return (
    <AppShell connectionStatus={connectionStatus} engineRunning={engineRunning}>
      <ConnectionBanner status={connectionStatus} isStale={false} />

      <div className="border-b border-graphite-700 px-8 py-4">
        <span className="font-mono text-sm font-semibold tracking-wide text-white">SIMULATION LAB</span>
      </div>

      {statusError && (
        <div className="border-b border-status-warning/30 bg-status-warning/10 px-8 py-2 font-mono text-[11px] text-status-warning">
          {statusError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
        <div className="h-[440px] border-b border-graphite-700 lg:h-auto lg:border-b-0 lg:border-r">
          <VehicleScene orientation={orientation} highlights={highlights} />
        </div>

        <div className="space-y-7 p-6">
          <EngineToggle engineRunning={engineRunning} busy={busy} onStart={handleStart} onStop={handleStop} onReset={handleReset} />
          <ScenarioSelector activeScenario={activeScenario} busy={busy} onSelect={handleScenario} />
          <SpeedSelector activeSpeed={activeSpeed} busy={busy} onSelect={handleSpeed} />

          <details className="group">
            <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-widest2 text-graphite-500 hover:text-graphite-300">
              MANUAL OVERRIDE
            </summary>
            <div className="mt-3">
              <ManualOverridePanel
                busy={busy}
                onSet={handleOverrideSet}
                onClear={handleOverrideClear}
                onClearAll={handleClearAll}
              />
            </div>
          </details>
        </div>
      </div>
    </AppShell>
  );
}

export default function SimulatorPage() {
  return (
    <RequireAuth>
      <SimulatorContent />
    </RequireAuth>
  );
}

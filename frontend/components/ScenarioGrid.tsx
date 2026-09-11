// components/ScenarioGrid.tsx
"use client";

import type { SimulationScenario } from "@/types/simulation";
import { SCENARIO_LABELS, SCENARIO_DESCRIPTIONS } from "@/types/simulation";

const SCENARIOS: SimulationScenario[] = ["HEALTHY", "OVERHEATING", "LOW_OIL_PRESSURE", "WEAK_BATTERY", "MULTIPLE_FAULTS"];

const SCENARIO_ACCENT: Record<SimulationScenario, string> = {
  HEALTHY: "#2dd4bf",
  OVERHEATING: "#e5484d",
  LOW_OIL_PRESSURE: "#f5a623",
  WEAK_BATTERY: "#f5a623",
  MULTIPLE_FAULTS: "#e5484d",
};

interface ScenarioGridProps {
  activeScenario: SimulationScenario | null;
  busy: boolean;
  onSelect: (scenario: SimulationScenario) => void;
}

export function ScenarioGrid({ activeScenario, busy, onSelect }: ScenarioGridProps) {
  return (
    <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-6">
      <div className="mb-4 text-[11px] uppercase tracking-wider text-graphite-500">Scenarios</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SCENARIOS.map((scenario) => {
          const isActive = activeScenario === scenario;
          const accent = SCENARIO_ACCENT[scenario];
          return (
            <button
              key={scenario}
              onClick={() => onSelect(scenario)}
              disabled={busy}
              className="rounded-md border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                borderColor: isActive ? accent : "#242d37",
                backgroundColor: isActive ? `${accent}14` : "#141a20",
              }}
            >
              <div
                className="mb-1 font-mono text-sm font-semibold uppercase tracking-wider"
                style={{ color: isActive ? accent : "#e4e9ed" }}
              >
                {SCENARIO_LABELS[scenario]}
              </div>
              <div className="text-xs leading-relaxed text-graphite-500">{SCENARIO_DESCRIPTIONS[scenario]}</div>
              {isActive && (
                <div className="mt-2 font-mono text-[10px] font-semibold tracking-wider" style={{ color: accent }}>
                  ● ACTIVE
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

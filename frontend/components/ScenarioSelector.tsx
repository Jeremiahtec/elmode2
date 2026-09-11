// components/ScenarioSelector.tsx
"use client";

import type { SimulationScenario } from "@/types/simulation";
import { SCENARIO_LABELS } from "@/types/simulation";

const SCENARIOS: SimulationScenario[] = ["HEALTHY", "OVERHEATING", "LOW_OIL_PRESSURE", "WEAK_BATTERY", "MULTIPLE_FAULTS"];

const ACCENT: Record<SimulationScenario, string> = {
  HEALTHY: "#3ecf8e",
  OVERHEATING: "#e5484d",
  LOW_OIL_PRESSURE: "#e8a13a",
  WEAK_BATTERY: "#e8a13a",
  MULTIPLE_FAULTS: "#e5484d",
};

interface ScenarioSelectorProps {
  activeScenario: SimulationScenario | null;
  busy: boolean;
  onSelect: (scenario: SimulationScenario) => void;
}

export function ScenarioSelector({ activeScenario, busy, onSelect }: ScenarioSelectorProps) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest2 text-graphite-500">
        SCENARIO
      </div>
      <div className="divide-y divide-graphite-800 border-y border-graphite-800">
        {SCENARIOS.map((scenario) => {
          const isActive = activeScenario === scenario;
          const accent = ACCENT[scenario];
          return (
            <button
              key={scenario}
              onClick={() => onSelect(scenario)}
              disabled={busy}
              className="flex w-full items-center justify-between py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className={`text-[13px] ${isActive ? "text-white" : "text-graphite-400"}`}>
                {SCENARIO_LABELS[scenario]}
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{ backgroundColor: isActive ? accent : "#3a424c" }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// types/simulation.ts
//
// Bound to com.elmode.simulation.model.SimulationScenario / SimulationStatusResponse

export type SimulationScenario =
  | "HEALTHY"
  | "OVERHEATING"
  | "LOW_OIL_PRESSURE"
  | "WEAK_BATTERY"
  | "MULTIPLE_FAULTS";

export interface SimulationStatusResponse {
  mockModeAvailable: boolean;
  engineRunning: boolean;
  activeScenario: SimulationScenario;
  speedMultiplier: number;
}

export const SCENARIO_LABELS: Record<SimulationScenario, string> = {
  HEALTHY: "Healthy Vehicle",
  OVERHEATING: "Overheating",
  LOW_OIL_PRESSURE: "Low Oil Pressure",
  WEAK_BATTERY: "Weak Battery",
  MULTIPLE_FAULTS: "Multiple Faults",
};

export const SCENARIO_DESCRIPTIONS: Record<SimulationScenario, string> = {
  HEALTHY: "Normal operating conditions across every system.",
  OVERHEATING: "Gradually increases coolant temperature toward a critical fault.",
  LOW_OIL_PRESSURE: "Gradually decreases oil pressure while RPM stays elevated.",
  WEAK_BATTERY: "Gradually decreases battery/charging voltage.",
  MULTIPLE_FAULTS: "Introduces overheating, low oil pressure, and weak battery together.",
};

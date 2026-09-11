// types/diagnostics.ts
//
// Bound field-for-field to backend records — see:
//   com.elmode.diagnostics.model.VehicleHealthSnapshot
//   com.elmode.diagnostics.model.ComponentDiagnosis
//   com.elmode.diagnostics.model.VehicleComponent

import type { DegradationStatus } from "./telemetry";

export type VehicleComponentType =
  | "ENGINE"
  | "COOLING_SYSTEM"
  | "LUBRICATION_SYSTEM"
  | "BATTERY_CHARGING_SYSTEM";

export interface ComponentDiagnosis {
  component: VehicleComponentType;
  status: DegradationStatus;
  healthPercent: number;
  detectedIssue: string;
  observedValue: number;
  observedUnit: string;
  safeRangeDescription: string;
  recommendedAction: string;
  lastUpdated: string;
}

export interface VehicleHealthSnapshot {
  nodeId: string;
  overallHealthPercent: number;
  overallStatus: DegradationStatus;
  components: ComponentDiagnosis[];
  evaluatedAt: string;
}

/** Display metadata not present on the backend enum — frontend-only presentation concern. */
export const COMPONENT_DISPLAY_NAMES: Record<VehicleComponentType, string> = {
  ENGINE: "Engine",
  COOLING_SYSTEM: "Cooling System",
  LUBRICATION_SYSTEM: "Lubrication System",
  BATTERY_CHARGING_SYSTEM: "Battery / Charging System",
};

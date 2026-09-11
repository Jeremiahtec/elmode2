// types/vehicle3d.ts
import type { VehicleComponentType } from "./diagnostics";
import type { DegradationStatus } from "./telemetry";

/** Named camera/vehicle orientations the scene smoothly interpolates between on navigation. */
export type VehicleOrientationPreset =
  | "dashboard" // three-quarter front
  | "telemetry" // toward front/engine
  | "diagnostics" // side/front
  | "simulator" // three-quarter rear/side
  | "vehicle-detail"; // slow orbit

export interface OrientationConfig {
  /** Camera position in world units. */
  cameraPosition: [number, number, number];
  /** Point the camera looks at. */
  target: [number, number, number];
  /** Whether this preset auto-orbits slowly (only vehicle-detail does). */
  autoOrbit: boolean;
}

export const ORIENTATION_PRESETS: Record<VehicleOrientationPreset, OrientationConfig> = {
  dashboard: { cameraPosition: [4.2, 2.1, 5.2], target: [0, 0.5, 0], autoOrbit: false },
  telemetry: { cameraPosition: [3.2, 1.4, 2.6], target: [0.8, 0.5, 0.6], autoOrbit: false },
  diagnostics: { cameraPosition: [-3.6, 1.8, 4.4], target: [0, 0.6, 0], autoOrbit: false },
  simulator: { cameraPosition: [-4.4, 2.4, -4.8], target: [0, 0.5, 0], autoOrbit: false },
  "vehicle-detail": { cameraPosition: [5, 2, 5], target: [0, 0.5, 0], autoOrbit: true },
};

/** Maps a diagnostic component to the approximate vehicle region that should highlight for it. */
export type VehicleRegion = "engine-bay" | "cooling" | "lubrication" | "battery";

export const COMPONENT_TO_REGION: Record<VehicleComponentType, VehicleRegion> = {
  ENGINE: "engine-bay",
  COOLING_SYSTEM: "cooling",
  LUBRICATION_SYSTEM: "lubrication",
  BATTERY_CHARGING_SYSTEM: "battery",
};

export interface RegionHighlight {
  region: VehicleRegion;
  status: DegradationStatus;
}

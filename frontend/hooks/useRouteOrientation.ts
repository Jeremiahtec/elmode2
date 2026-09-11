// hooks/useRouteOrientation.ts
"use client";

import { usePathname } from "next/navigation";
import type { VehicleOrientationPreset } from "@/types/vehicle3d";

const ROUTE_ORIENTATION: Record<string, VehicleOrientationPreset> = {
  "/": "dashboard",
  "/telemetry": "telemetry",
  "/diagnostics": "diagnostics",
  "/simulator": "simulator",
  "/vehicle": "vehicle-detail",
};

export function useRouteOrientation(): VehicleOrientationPreset {
  const pathname = usePathname();
  return ROUTE_ORIENTATION[pathname] ?? "dashboard";
}

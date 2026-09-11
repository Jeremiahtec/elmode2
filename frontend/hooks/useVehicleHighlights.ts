// hooks/useVehicleHighlights.ts
import type { VehicleHealthSnapshot } from "@/types/diagnostics";
import type { RegionHighlight } from "@/types/vehicle3d";
import { COMPONENT_TO_REGION } from "@/types/vehicle3d";

export function useVehicleHighlights(diagnostics: VehicleHealthSnapshot | null): RegionHighlight[] {
  if (!diagnostics) return [];
  return diagnostics.components.map((c) => ({
    region: COMPONENT_TO_REGION[c.component],
    status: c.status,
  }));
}

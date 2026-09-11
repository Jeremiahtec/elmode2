// app/vehicle/page.tsx
"use client";

import { useElmodeStream } from "@/hooks/useElmodeStream";
import { useVehicleHighlights } from "@/hooks/useVehicleHighlights";
import { useRouteOrientation } from "@/hooks/useRouteOrientation";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { VehicleScene } from "@/components/vehicle3d/VehicleScene";
import { DEFAULT_NODE_ID } from "@/lib/api";

function VehicleDetailContent() {
  const { diagnostics, connectionStatus, isTelemetryStale } = useElmodeStream();
  const highlights = useVehicleHighlights(diagnostics);
  const orientation = useRouteOrientation();

  return (
    <AppShell connectionStatus={connectionStatus}>
      <ConnectionBanner status={connectionStatus} isStale={isTelemetryStale} />

      <div className="border-b border-graphite-700 px-8 py-5">
        <div className="font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">Vehicle</div>
        <div className="text-lg font-semibold text-white">Simulated Test Vehicle</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
        <div className="h-[480px] border-b border-graphite-700 lg:h-[560px] lg:border-b-0 lg:border-r">
          <VehicleScene orientation={orientation} highlights={highlights} />
        </div>

        <div className="space-y-6 p-6">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Identity</div>
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between border-b border-graphite-800 pb-2">
                <dt className="text-graphite-500">Node ID</dt>
                <dd className="font-mono text-graphite-200">{DEFAULT_NODE_ID}</dd>
              </div>
              <div className="flex justify-between border-b border-graphite-800 pb-2">
                <dt className="text-graphite-500">Source</dt>
                <dd className="text-graphite-200">Simulated (OBD-II mock)</dd>
              </div>
              <div className="flex justify-between border-b border-graphite-800 pb-2">
                <dt className="text-graphite-500">Model</dt>
                <dd className="text-graphite-200">Procedural (no GLTF asset loaded)</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-graphite-700 bg-graphite-850 p-4">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Model Asset</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function VehicleDetailPage() {
  return (
    <RequireAuth>
      <VehicleDetailContent />
    </RequireAuth>
  );
}

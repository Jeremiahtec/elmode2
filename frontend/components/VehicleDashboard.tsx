"use client";

import { useTelemetry } from "@/hooks/useTelemetry";
import VehicleModelCanvas from "@/components/VehicleModelCanvas";

export function VehicleDashboard() {
  const { telemetry, connectionStatus } = useTelemetry();

  return (
    <div className="relative w-full h-full">
      {/* 3D Vehicle Canvas */}
      <VehicleModelCanvas telemetry={telemetry} className="absolute inset-0" />
      
      {/* Connection Status Overlay */}
      {connectionStatus !== "connected" && (
        <div className="absolute top-4 left-4 rounded-md bg-black/80 border border-zinc-800 px-3 py-1.5 text-sm text-amber-400 z-10">
          {connectionStatus === "connecting" ? "Connecting to telemetry…" : "Reconnecting…"}
        </div>
      )}

      {/* Live Data Readout Panel */}
      <div className="absolute bottom-6 left-6 rounded-xl bg-black/80 border border-zinc-800 p-5 text-white z-10 shadow-lg backdrop-blur-sm min-w-[200px]">
        <h2 className="text-teal-400 font-bold tracking-wider text-xs mb-3">LIVE TELEMETRY</h2>
        
        <div className="flex flex-col gap-2 font-mono text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">RPM</span>
            <span className="font-bold">{telemetry.ENGINE_RPM?.value ?? "—"}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Coolant</span>
            <span className="font-bold">{telemetry.COOLANT_TEMP?.value ?? "—"} °C</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Load</span>
            <span className="font-bold">{telemetry.ENGINE_LOAD?.value ?? "—"} %</span>
          </div>

          {/* Degradation Status */}
          <div className="mt-2 pt-3 border-t border-zinc-800 flex justify-between gap-4">
            <span className="text-zinc-400">Status</span>
            <span className={`font-bold ${
              telemetry.ENGINE_RPM?.status === 'CRITICAL' ? 'text-red-500' : 
              telemetry.ENGINE_RPM?.status === 'WARNING' ? 'text-amber-500' : 
              'text-teal-400'
            }`}>
              {telemetry.ENGINE_RPM?.status ?? "INFO"}
            </span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
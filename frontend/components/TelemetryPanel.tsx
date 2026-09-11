"use client";

import { useTelemetry } from "@/hooks/useTelemetry";

export function TelemetryPanel() {
  const { telemetry, connectionStatus, isHydrated, error } = useTelemetry();

  if (!isHydrated) {
    return <div>Loading initial telemetry snapshot...</div>;
  }

  return (
    <div>
      <div>Status: {connectionStatus}</div>
      {error && <div style={{ color: "orange" }}>Warning: {error}</div>}
      <div>RPM: {telemetry.ENGINE_RPM?.value ?? "—"}</div>
      <div>Coolant Temp: {telemetry.COOLANT_TEMP?.value ?? "—"}°C</div>
      <div>Engine Load: {telemetry.ENGINE_LOAD?.value ?? "—"}%</div>
    </div>
  );
}
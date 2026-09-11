// types/telemetry.ts
//
// Bound field-for-field to backend records — see:
//   com.elmode.telemetry.model.TelemetryBroadcastMessage
//   com.elmode.telemetry.model.DegradationStatus
//   com.elmode.ingestion.model.TelemetryMetric
//
// Jackson serializes Java records using their declared field names as
// camelCase JSON keys, so these interfaces mirror the record parameter
// lists exactly. Do not add fields here that don't exist on the backend
// record — that's how frontend/backend contracts silently drift.

export type TelemetryMetricType =
  | "ENGINE_RPM"
  | "COOLANT_TEMP"
  | "ENGINE_LOAD"
  | "OIL_PRESSURE"
  | "BATTERY_VOLTAGE";

export type DegradationStatus = "INFO" | "WARNING" | "CRITICAL";

export interface TelemetryBroadcastMessage {
  nodeId: string;
  metric: TelemetryMetricType;
  value: number;
  unit: string;
  timestamp: string; // ISO-8601 (java.time.Instant default serialization)
  status: DegradationStatus;
  source: "HARDWARE" | "MOCK";
}

export type TelemetrySnapshot = Partial<Record<TelemetryMetricType, TelemetryBroadcastMessage>>;

/** Rolling chart point — derived client-side from TelemetryBroadcastMessage, not a backend type. */
export interface ChartPoint {
  t: number; // ms epoch, for x-axis ordering
  value: number;
}

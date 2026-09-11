// lib/metricDisplay.ts
import type { TelemetryMetricType, DegradationStatus } from "@/types/telemetry";

export interface MetricDisplayMeta {
  label: string;
  unit: string;
  safeRange: string;
  precision: number;
}

// Safe-range strings mirror DiagnosticEngine's threshold constants
// (com.elmode.diagnostics.service.DiagnosticEngine) for human display.
// These are presentation copies, not a second source of truth for status —
// actual status classification always comes from the backend payload's
// `status` field, never recomputed here.
export const METRIC_DISPLAY: Record<TelemetryMetricType, MetricDisplayMeta> = {
  ENGINE_RPM: { label: "Engine RPM", unit: "rpm", safeRange: "700 – 6,000 rpm", precision: 0 },
  COOLANT_TEMP: { label: "Coolant Temperature", unit: "°C", safeRange: "85 – 100 °C", precision: 1 },
  ENGINE_LOAD: { label: "Engine Load", unit: "%", safeRange: "0 – 90 %", precision: 1 },
  OIL_PRESSURE: { label: "Oil Pressure", unit: "psi", safeRange: "25 – 65 psi", precision: 1 },
  BATTERY_VOLTAGE: { label: "Battery Voltage", unit: "V", safeRange: "13.0 – 14.7 V", precision: 1 },
};

export const STATUS_COLOR: Record<DegradationStatus, string> = {
  INFO: "#2dd4bf",
  WARNING: "#f5a623",
  CRITICAL: "#e5484d",
};

export const STATUS_LABEL: Record<DegradationStatus, string> = {
  INFO: "HEALTHY",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
};

export function formatValue(value: number, precision: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });
}

export function formatHealthStatus(percent: number): DegradationStatus {
  // Presentation-only bucketing for the big health number's color — the
  // authoritative overallStatus still comes from the backend snapshot;
  // this is only used as a fallback if overallStatus is somehow absent.
  if (percent < 40) return "CRITICAL";
  if (percent < 75) return "WARNING";
  return "INFO";
}

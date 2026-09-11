// components/gauges/InstrumentGauges.tsx
"use client";

import { RadialGauge } from "./RadialGauge";
import { useSmoothedValue } from "@/hooks/useSmoothedValue";
import { STATUS_COLOR } from "@/lib/metricDisplay";
import type { DegradationStatus } from "@/types/telemetry";

const STATUS_WORD: Record<DegradationStatus, string> = {
  INFO: "NORMAL",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
};

interface GaugeCommonProps {
  value: number | undefined;
  status: DegradationStatus | undefined;
}

/** Tachometer-style RPM dial — the largest, most dominant instrument on the dashboard. */
export function RpmGauge({ value, status }: GaugeCommonProps) {
  const smoothed = useSmoothedValue(value, 0.12);
  const color = status ? STATUS_COLOR[status] : "#5a6570";
  const display = smoothed ?? 0;

  return (
    <div className="flex flex-col items-center">
      <RadialGauge value={display} min={0} max={7000} size={200} strokeWidth={10} color={color} sweepDegrees={270}>
        <div className="font-mono text-4xl font-bold tabular-nums text-white">
          {value !== undefined ? Math.round(display).toLocaleString() : "—"}
        </div>
        <div className="mt-0.5 font-mono text-[10px] tracking-widest2 text-graphite-500">RPM</div>
      </RadialGauge>
      <div className="mt-3 text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Engine RPM</div>
        <div className="font-mono text-[10px] text-graphite-600">700 — 6,000 · {status ? STATUS_WORD[status] : "—"}</div>
      </div>
    </div>
  );
}

/** Compact arc gauge for coolant temperature. */
export function CoolantGauge({ value, status }: GaugeCommonProps) {
  const smoothed = useSmoothedValue(value, 0.08);
  const color = status ? STATUS_COLOR[status] : "#5a6570";
  const display = smoothed ?? 20;

  return (
    <div className="flex items-center gap-4">
      <RadialGauge value={display} min={20} max={130} size={72} strokeWidth={6} color={color} sweepDegrees={270}>
        <div className="font-mono text-base font-bold tabular-nums text-white">
          {value !== undefined ? Math.round(display) : "—"}
        </div>
      </RadialGauge>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Coolant</div>
        <div className="font-mono text-lg font-semibold text-white">
          {value !== undefined ? `${display.toFixed(0)}°C` : "—"}
        </div>
        <div className="font-mono text-[10px]" style={{ color }}>
          {status ? STATUS_WORD[status] : "NO DATA"}
        </div>
      </div>
    </div>
  );
}

/** Compact arc gauge for oil pressure. */
export function OilPressureGauge({ value, status }: GaugeCommonProps) {
  const smoothed = useSmoothedValue(value, 0.08);
  const color = status ? STATUS_COLOR[status] : "#5a6570";
  const display = smoothed ?? 0;

  return (
    <div className="flex items-center gap-4">
      <RadialGauge value={display} min={0} max={80} size={72} strokeWidth={6} color={color} sweepDegrees={270}>
        <div className="font-mono text-base font-bold tabular-nums text-white">
          {value !== undefined ? Math.round(display) : "—"}
        </div>
      </RadialGauge>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Oil Pressure</div>
        <div className="font-mono text-lg font-semibold text-white">
          {value !== undefined ? `${display.toFixed(0)} PSI` : "—"}
        </div>
        <div className="font-mono text-[10px]" style={{ color }}>
          {status ? STATUS_WORD[status] : "NO DATA"}
        </div>
      </div>
    </div>
  );
}

/** Battery gets a slim horizontal cell indicator rather than a radial arc — visually distinct treatment, matches how batteries are conventionally read. */
export function BatteryIndicator({ value, status }: GaugeCommonProps) {
  const smoothed = useSmoothedValue(value, 0.1);
  const color = status ? STATUS_COLOR[status] : "#5a6570";
  const display = smoothed ?? 0;
  const fraction = Math.max(0, Math.min(1, (display - 9) / (15 - 9)));

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">Battery</div>
        <div className="font-mono text-[10px]" style={{ color }}>
          {status ? STATUS_WORD[status] : "NO DATA"}
        </div>
      </div>
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-bold tabular-nums text-white">
          {value !== undefined ? display.toFixed(1) : "—"}
        </span>
        <span className="font-mono text-xs text-graphite-500">V</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${fraction * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** Large circular vehicle-health ring — the dashboard's single most important number. */
export function HealthRing({ percent, status }: { percent: number | undefined; status: DegradationStatus | undefined }) {
  const smoothed = useSmoothedValue(percent, 0.1);
  const color = status ? STATUS_COLOR[status] : "#5a6570";
  const display = smoothed ?? 0;

  return (
    <RadialGauge value={display} min={0} max={100} size={168} strokeWidth={9} color={color} sweepDegrees={300}>
      <div
        className={`font-mono text-5xl font-bold tabular-nums text-white ${status === "CRITICAL" ? "pulse-critical" : ""}`}
      >
        {percent !== undefined ? Math.round(display) : "—"}
      </div>
      <div className="mt-0.5 font-mono text-[10px] tracking-widest2 text-graphite-500">% HEALTH</div>
    </RadialGauge>
  );
}

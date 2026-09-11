// components/ManualOverridePanel.tsx
"use client";

import { useState } from "react";
import type { TelemetryMetricType } from "@/types/telemetry";
import { METRIC_DISPLAY } from "@/lib/metricDisplay";

const OVERRIDE_METRICS: { metric: TelemetryMetricType; min: number; max: number; step: number }[] = [
  { metric: "COOLANT_TEMP", min: 70, max: 130, step: 1 },
  { metric: "OIL_PRESSURE", min: 0, max: 80, step: 1 },
  { metric: "BATTERY_VOLTAGE", min: 9, max: 15, step: 0.1 },
  { metric: "ENGINE_RPM", min: 700, max: 7500, step: 50 },
];

interface ManualOverridePanelProps {
  busy: boolean;
  onSet: (metric: TelemetryMetricType, value: number) => void;
  onClear: (metric: TelemetryMetricType) => void;
  onClearAll: () => void;
}

export function ManualOverridePanel({ busy, onSet, onClear, onClearAll }: ManualOverridePanelProps) {
  const [active, setActive] = useState<Partial<Record<TelemetryMetricType, number>>>({});

  return (
    <div>
      <div className="mb-1 flex items-center justify-end">
        <button
          onClick={() => {
            setActive({});
            onClearAll();
          }}
          disabled={busy}
          className="font-mono text-[10px] uppercase tracking-wider text-graphite-600 hover:text-white disabled:opacity-40"
        >
          Clear All
        </button>
      </div>
      <div className="space-y-4 pt-2">
        {OVERRIDE_METRICS.map(({ metric, min, max, step }) => {
          const meta = METRIC_DISPLAY[metric];
          const isActive = active[metric] !== undefined;
          return (
            <div key={metric}>
              <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
                <span className="text-graphite-500">{meta.label}</span>
                <span className={isActive ? "text-white" : "text-graphite-600"}>
                  {isActive ? `${active[metric]} ${meta.unit}` : "not overridden"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  disabled={busy}
                  value={active[metric] ?? (min + max) / 2}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setActive((prev) => ({ ...prev, [metric]: value }));
                    onSet(metric, value);
                  }}
                  className="h-1.5 flex-1 cursor-pointer accent-status-warning disabled:cursor-not-allowed"
                />
                {isActive && (
                  <button
                    onClick={() => {
                      setActive((prev) => {
                        const next = { ...prev };
                        delete next[metric];
                        return next;
                      });
                      onClear(metric);
                    }}
                    disabled={busy}
                    className="font-mono text-[10px] uppercase text-graphite-500 hover:text-white disabled:opacity-40"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

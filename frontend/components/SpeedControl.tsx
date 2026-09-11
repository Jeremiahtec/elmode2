// components/SpeedControl.tsx
"use client";

const SPEEDS = [1, 2, 5, 10];

interface SpeedControlProps {
  activeSpeed: number;
  busy: boolean;
  onSelect: (speed: number) => void;
}

export function SpeedControl({ activeSpeed, busy, onSelect }: SpeedControlProps) {
  return (
    <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-6">
      <div className="mb-4 text-[11px] uppercase tracking-wider text-graphite-500">Simulation Speed</div>
      <div className="grid grid-cols-4 gap-3">
        {SPEEDS.map((speed) => {
          const isActive = activeSpeed === speed;
          const isFast = speed >= 5;
          return (
            <button
              key={speed}
              onClick={() => onSelect(speed)}
              disabled={busy}
              className={`rounded-md border py-3 font-mono text-sm font-bold tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isActive
                  ? isFast
                    ? "border-status-warning bg-status-warning/15 text-status-warning"
                    : "border-status-healthy bg-status-healthy/15 text-status-healthy"
                  : "border-graphite-600 bg-graphite-800 text-base-100 hover:bg-graphite-700"
              }`}
            >
              {speed}×
            </button>
          );
        })}
      </div>
    </div>
  );
}

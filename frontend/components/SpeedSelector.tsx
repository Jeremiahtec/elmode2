// components/SpeedSelector.tsx
"use client";

const SPEEDS = [1, 2, 5, 10];

export function SpeedSelector({
  activeSpeed,
  busy,
  onSelect,
}: {
  activeSpeed: number;
  busy: boolean;
  onSelect: (speed: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest2 text-graphite-500">
        SIMULATION SPEED
      </div>
      <div className="inline-flex rounded-md border border-graphite-700 bg-graphite-900 p-0.5">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            onClick={() => onSelect(speed)}
            disabled={busy}
            className={`rounded px-3.5 py-1.5 font-mono text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              activeSpeed === speed ? "bg-accent text-graphite-950" : "text-graphite-400 hover:text-white"
            }`}
          >
            {speed}×
          </button>
        ))}
      </div>
    </div>
  );
}

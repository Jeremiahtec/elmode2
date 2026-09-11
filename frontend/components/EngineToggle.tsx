// components/EngineToggle.tsx
"use client";

export function EngineToggle({
  engineRunning,
  busy,
  onStart,
  onStop,
  onReset,
}: {
  engineRunning: boolean;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest2 text-graphite-500">ENGINE</span>
        <span className={`font-mono text-[11px] font-semibold ${engineRunning ? "text-status-healthy" : "text-graphite-600"}`}>
          {engineRunning ? "RUNNING" : "OFF"}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={engineRunning ? onStop : onStart}
          disabled={busy}
          className={`flex-1 rounded-md border py-2 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            engineRunning
              ? "border-status-warning/40 bg-status-warning/10 text-status-warning hover:bg-status-warning/20"
              : "border-status-healthy/40 bg-status-healthy/10 text-status-healthy hover:bg-status-healthy/20"
          }`}
        >
          {engineRunning ? "Stop" : "Start"}
        </button>
        <button
          onClick={onReset}
          disabled={busy}
          className="rounded-md border border-graphite-600 bg-graphite-850 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-graphite-300 transition-colors hover:bg-graphite-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

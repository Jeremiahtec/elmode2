"use client";

import { pcurve } from "three/examples/jsm/nodes/Nodes.js";

interface EngineControlPanelProps {
  engineRunning: boolean;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function EngineControlPanel({ engineRunning, busy, onStart, onStop, onReset }: EngineControlPanelProps) {
  return (
    <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-graphite-500">Engine Control</div>
        <div className={`font-mono text-xs font-semibold tracking-wider ${engineRunning ? "text-status-healthy" : "text-graphite-500"}`}>
          {engineRunning ? "● RUNNING" : "○ STOPPED"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onStart}
          disabled={busy || engineRunning}
          className="rounded-md border border-status-healthy/40 bg-status-healthy/10 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-status-healthy transition-colors hover:bg-status-healthy/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Start Engine
        </button>
        <button
          onClick={onStop}
          disabled={busy || !engineRunning}
          className="rounded-md border border-status-warning/40 bg-status-warning/10 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-status-warning transition-colors hover:bg-status-warning/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Stop Engine
        </button>
        <button
          onClick={onReset}
          disabled={busy}
          className="rounded-md border border-graphite-600 bg-graphite-800 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-base-100 transition-colors hover:bg-graphite-700 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

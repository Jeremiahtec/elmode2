// lib/copy.ts
//
// Single source for UI copy. Rule: short, technical, data-forward.
// No "real-time monitoring system" style AI-SaaS phrasing anywhere.

export const COPY = {
  brand: "ELMODE",
  tagline: "VEHICLE INTELLIGENCE",

  status: {
    connected: "CONNECTED",
    offline: "OFFLINE",
    live: "LIVE",
    down: "DOWN",
    engineRunning: "ENGINE RUNNING",
    engineOff: "ENGINE OFF",
    noActiveFaults: "NO ACTIVE FAULTS",
    stopped: "SIMULATION STOPPED",
    stale: "TELEMETRY STALE",
  },

  simulator: {
    title: "SIMULATION LAB",
  },
} as const;

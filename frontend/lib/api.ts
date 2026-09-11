// lib/api.ts
//
// Single point of contact with the Spring Boot backend's REST surface.
// Every endpoint the frontend calls is listed here — nothing calls fetch()
// directly from a component, so the full frontend/backend HTTP contract is
// auditable in one file.

import type { TelemetryBroadcastMessage } from "@/types/telemetry";
import type { VehicleHealthSnapshot } from "@/types/diagnostics";
import type { SimulationScenario, SimulationStatusResponse } from "@/types/simulation";

const API_BASE = process.env.NEXT_PUBLIC_ELMODE_API_URL ?? "http://localhost:8080";

export class BackendUnreachableError extends Error {
  constructor(cause?: unknown) {
    super("Backend is unreachable");
    this.name = "BackendUnreachableError";
    if (cause instanceof Error) this.cause = cause;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch (err) {
    // fetch() throws on network failure (backend down, CORS block, DNS) —
    // this is exactly the "BACKEND OFFLINE" case the dashboard must detect.
    throw new BackendUnreachableError(err);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Request failed: ${response.status} ${response.statusText} ${body}`);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return (await response.json()) as T;
}

// --- Telemetry ---
export function getLatestTelemetry(nodeId?: string): Promise<TelemetryBroadcastMessage[]> {
  const query = nodeId ? `?nodeId=${encodeURIComponent(nodeId)}` : "";
  return request<TelemetryBroadcastMessage[]>(`/api/telemetry/latest${query}`);
}

// --- Diagnostics ---
export function getLatestDiagnosis(nodeId?: string): Promise<VehicleHealthSnapshot> {
  const query = nodeId ? `?nodeId=${encodeURIComponent(nodeId)}` : "";
  return request<VehicleHealthSnapshot>(`/api/diagnostics/latest${query}`);
}

// --- Simulation control ---
export function getSimulationStatus(): Promise<SimulationStatusResponse> {
  return request<SimulationStatusResponse>("/api/simulation/status");
}

export function startEngine(): Promise<void> {
  return request<void>("/api/simulation/engine/start", { method: "POST" });
}

export function stopEngine(): Promise<void> {
  return request<void>("/api/simulation/engine/stop", { method: "POST" });
}

export function selectScenario(scenario: SimulationScenario): Promise<void> {
  return request<void>(`/api/simulation/scenario/${scenario}`, { method: "POST" });
}

export function setSimulationSpeed(multiplier: number): Promise<void> {
  return request<void>(`/api/simulation/speed/${multiplier}`, { method: "POST" });
}

export function resetSimulation(): Promise<void> {
  return request<void>("/api/simulation/reset", { method: "POST" });
}

export const WS_URL = process.env.NEXT_PUBLIC_ELMODE_WS_URL ?? "http://localhost:8080/ws-telemetry";
// Must match obd.mock.node-id / obd.vehicle.node-id in application.properties
// (both are VEH-001 as of the fix in application.properties — see comment there).
export const DEFAULT_NODE_ID = process.env.NEXT_PUBLIC_ELMODE_NODE_ID ?? "VEH-001";

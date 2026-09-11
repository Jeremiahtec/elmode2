// components/ConnectionBanner.tsx
import type { ConnectionStatus } from "@/hooks/useElmodeStream";

export function ConnectionBanner({ status, isStale }: { status: ConnectionStatus; isStale: boolean }) {
  if (status === "backend-offline") {
    return (
      <div className="flex items-center gap-2 border-b border-status-critical/30 bg-status-critical/10 px-4 py-2 text-sm font-mono text-status-critical">
        <span className="h-2 w-2 rounded-full bg-status-critical pulse-critical" />
        BACKEND OFFLINE — cannot reach {process.env.NEXT_PUBLIC_ELMODE_API_URL ?? "http://localhost:8080"}. Start the Spring Boot backend and refresh.
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="flex items-center gap-2 border-b border-status-warning/30 bg-status-warning/10 px-4 py-2 text-sm font-mono text-status-warning">
        <span className="h-2 w-2 rounded-full bg-status-warning" />
        WEBSOCKET DISCONNECTED — attempting to reconnect...
      </div>
    );
  }

  if (status === "connected" && isStale) {
    return (
      <div className="flex items-center gap-2 border-b border-status-warning/30 bg-status-warning/10 px-4 py-2 text-sm font-mono text-status-warning">
        <span className="h-2 w-2 rounded-full bg-status-warning" />
        TELEMETRY STALE — no data received recently. Values shown may be out of date.
      </div>
    );
  }

  return null;
}

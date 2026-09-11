// components/AppHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ConnectionStatus } from "@/hooks/useElmodeStream";

interface AppHeaderProps {
  connectionStatus: ConnectionStatus;
  engineRunning?: boolean;
}

function Dot({ ok }: { ok: boolean }) {
  return <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-status-healthy" : "bg-graphite-500"}`} />;
}

export function AppHeader({ connectionStatus, engineRunning }: AppHeaderProps) {
  const pathname = usePathname();
  const backendConnected = connectionStatus !== "backend-offline";
  const wsConnected = connectionStatus === "connected";

  return (
    <header className="sticky top-0 z-20 border-b border-graphite-700 bg-graphite-950/95 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="font-mono text-lg font-bold tracking-widest text-white">ELMODE</div>
            <div className="text-[11px] uppercase tracking-wider text-graphite-500">
              Vehicle Diagnostic &amp; Telemetry Monitoring
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-md border border-graphite-700 bg-graphite-900 p-1">
          <Link
            href="/"
            className={`rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              pathname === "/" ? "bg-graphite-700 text-white" : "text-graphite-500 hover:text-white"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/simulator"
            className={`rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              pathname === "/simulator" ? "bg-graphite-700 text-white" : "text-graphite-500 hover:text-white"
            }`}
          >
            Simulator
          </Link>
        </nav>

        <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-graphite-500">
          <div className="flex items-center gap-1.5">
            <Dot ok={backendConnected} />
            Backend {backendConnected ? "Connected" : "Offline"}
          </div>
          <div className="flex items-center gap-1.5">
            <Dot ok={wsConnected} />
            WebSocket {wsConnected ? "Connected" : "Disconnected"}
          </div>
          {engineRunning !== undefined && (
            <div className="flex items-center gap-1.5">
              <Dot ok={engineRunning} />
              Simulation {engineRunning ? "Running" : "Stopped"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

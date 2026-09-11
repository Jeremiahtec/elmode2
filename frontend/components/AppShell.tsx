// components/AppShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ConnectionStatus } from "@/hooks/useElmodeStream";
import {
  IconGauge,
  IconWaveform,
  IconStethoscope,
  IconSliders,
  IconHistory,
  IconCar,
  IconSettings,
  IconUser,
  IconChevronDown,
} from "./icons";
import { useAuth } from "@/hooks/useAuth";

const OVERVIEW_ITEMS = [
  { href: "/", label: "Dashboard", icon: IconGauge },
  { href: "/telemetry", label: "Live Telemetry", icon: IconWaveform },
  { href: "/diagnostics", label: "Diagnostics", icon: IconStethoscope },
  { href: "/simulator", label: "Simulator", icon: IconSliders },
];

const VEHICLE_ITEMS = [
  { href: "/vehicle", label: "Vehicle", icon: IconCar },
  { href: "/fault-history", label: "Fault History", icon: IconHistory },
];

const SYSTEM_ITEMS = [
  { href: "/account", label: "Account", icon: IconUser },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

function StatusDot({ ok, pulse = false }: { ok: boolean; pulse?: boolean }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-status-healthy" : "bg-graphite-600"} ${
        pulse && ok ? "shadow-[0_0_6px_1px_rgba(62,207,142,0.6)]" : ""
      }`}
    />
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string; icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element }[];
  pathname: string;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 px-3 font-mono text-[9px] font-semibold tracking-widest2 text-graphite-600">{label}</div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors ${
                active ? "bg-accent/10 text-accent" : "text-graphite-400 hover:bg-graphite-800 hover:text-graphite-100"
              }`}
            >
              <Icon className={`h-[15px] w-[15px] ${active ? "text-accent" : "text-graphite-500 group-hover:text-graphite-300"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface AppShellProps {
  connectionStatus: ConnectionStatus;
  engineRunning?: boolean;
  children: React.ReactNode;
}

export function AppShell({ connectionStatus, engineRunning, children }: AppShellProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const backendConnected = connectionStatus !== "backend-offline";
  const wsConnected = connectionStatus === "connected";

  return (
    <div className="flex min-h-screen bg-graphite-900">
      <aside className="flex w-[208px] shrink-0 flex-col border-r border-graphite-700 bg-graphite-950">
        <Link href="/" className="flex items-center gap-2 px-5 py-5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="M3 15v-2.5l1.8-3.6A2 2 0 0 1 6.6 7.8h10.8a2 2 0 0 1 1.8 1.1L21 12.5V15" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 15h18M6.5 15.5v1.2M17.5 15.5v1.2" strokeLinecap="round" />
          </svg>
          <span className="font-mono text-[13px] font-bold tracking-widest2 text-white">ELMODE</span>
        </Link>

        <nav className="flex-1 px-3 pt-2">
          <NavGroup label="OVERVIEW" items={[...OVERVIEW_ITEMS]} pathname={pathname} />
          <NavGroup label="VEHICLE" items={[...VEHICLE_ITEMS]} pathname={pathname} />
          <NavGroup label="SYSTEM" items={[...SYSTEM_ITEMS]} pathname={pathname} />
        </nav>

        <div className="border-t border-graphite-700 px-5 py-4">
          <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-wider text-graphite-300">
            <StatusDot ok={backendConnected} pulse /> {backendConnected ? "CONNECTED" : "OFFLINE"}
          </div>
          <div className="space-y-1 font-mono text-[10px] text-graphite-600">
            <div className="flex items-center gap-1.5">
              <StatusDot ok={wsConnected} /> STREAM {wsConnected ? "LIVE" : "DOWN"}
            </div>
            {engineRunning !== undefined && (
              <div className="flex items-center gap-1.5">
                <StatusDot ok={engineRunning} /> ENGINE {engineRunning ? "RUNNING" : "OFF"}
              </div>
            )}
          </div>
        </div>

        <div className="relative border-t border-graphite-700 p-3">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-graphite-800"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] font-bold text-accent">
              {user?.name?.[0]?.toUpperCase() ?? <IconUser className="h-3.5 w-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] text-graphite-100">{user?.name ?? "Guest"}</div>
            </div>
            <IconChevronDown className={`h-3.5 w-3.5 text-graphite-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-[calc(100%-4px)] left-3 right-3 z-30 overflow-hidden rounded-md border border-graphite-700 bg-graphite-850 shadow-panel">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center px-3 py-2.5 text-left text-[12px] text-status-critical hover:bg-graphite-800"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

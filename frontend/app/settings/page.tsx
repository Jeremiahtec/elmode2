// app/settings/page.tsx
"use client";

import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useElmodeStream } from "@/hooks/useElmodeStream";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { SettingsToggle } from "@/components/SettingsToggle";
import { SegmentedControl } from "@/components/SegmentedControl";

function SettingsContent() {
  const { connectionStatus } = useElmodeStream();
  const { signOut } = useAuth();
  const { settings, update } = useSettings();

  return (
    <AppShell connectionStatus={connectionStatus}>
      <ConnectionBanner status={connectionStatus} isStale={false} />

      <div className="border-b border-graphite-700 px-8 py-5">
        <div className="font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">Settings</div>
        <div className="text-lg font-semibold text-white">Preferences</div>
      </div>

      <div className="max-w-2xl space-y-8 p-8">
        <section>
          <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest2 text-graphite-400">
            Appearance
          </h2>
          <div className="flex items-center justify-between border-b border-graphite-800 py-3">
            <div>
              <div className="text-[13px] text-graphite-200">Theme</div>
              <div className="text-[11px] text-graphite-600">
                Light theme is not implemented yet — ELMODE is dark-only today.
              </div>
            </div>
            <SegmentedControl
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
              ]}
              value={settings.theme}
              onChange={(v) => update("theme", v)}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest2 text-graphite-400">
            Units
          </h2>
          <div className="divide-y divide-graphite-800 border-b border-graphite-800">
            <div className="flex items-center justify-between py-3">
              <div className="text-[13px] text-graphite-200">Temperature</div>
              <SegmentedControl
                options={[
                  { value: "C", label: "°C" },
                  { value: "F", label: "°F" },
                ]}
                value={settings.temperatureUnit}
                onChange={(v) => update("temperatureUnit", v)}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="text-[13px] text-graphite-200">Pressure</div>
              <SegmentedControl
                options={[
                  { value: "PSI", label: "PSI" },
                  { value: "kPa", label: "kPa" },
                ]}
                value={settings.pressureUnit}
                onChange={(v) => update("pressureUnit", v)}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="text-[13px] text-graphite-200">Speed</div>
              <SegmentedControl
                options={[
                  { value: "kmh", label: "km/h" },
                  { value: "mph", label: "mph" },
                ]}
                value={settings.speedUnit}
                onChange={(v) => update("speedUnit", v)}
              />
            </div>
          </div>
          <p className="pt-2 text-[11px] text-graphite-600">
            Unit preferences are saved but not yet wired into the telemetry display components — values shown
            throughout the app are currently always in the backend&apos;s native units (°C, PSI, km/h).
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest2 text-graphite-400">
            Notifications
          </h2>
          <div className="divide-y divide-graphite-800 border-b border-graphite-800">
            <SettingsToggle
              label="Diagnostic alerts"
              description="Notify when a component status changes"
              checked={settings.notifyDiagnosticAlerts}
              onChange={(v) => update("notifyDiagnosticAlerts", v)}
            />
            <SettingsToggle
              label="Critical fault alerts"
              description="Notify on CRITICAL status specifically"
              checked={settings.notifyCriticalFaults}
              onChange={(v) => update("notifyCriticalFaults", v)}
            />
            <SettingsToggle
              label="Simulation alerts"
              description="Notify on engine start/stop and scenario changes"
              checked={settings.notifySimulationEvents}
              onChange={(v) => update("notifySimulationEvents", v)}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest2 text-graphite-400">
            Security
          </h2>
          <div className="flex items-center justify-between border-b border-graphite-800 py-3">
            <div>
              <div className="text-[13px] text-graphite-200">Sign out</div>
              <div className="text-[11px] text-graphite-600">Ends your current session on this device.</div>
            </div>
            <button
              onClick={signOut}
              className="rounded-md border border-status-critical/40 bg-status-critical/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-status-critical hover:bg-status-critical/20"
            >
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}

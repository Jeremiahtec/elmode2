// hooks/useSettings.ts
"use client";

import { useCallback, useEffect, useState } from "react";

export interface ElmodeSettings {
  theme: "dark" | "light"; // light is accepted but not implemented — see SettingsPage note
  temperatureUnit: "C" | "F";
  pressureUnit: "PSI" | "kPa";
  speedUnit: "kmh" | "mph";
  notifyDiagnosticAlerts: boolean;
  notifyCriticalFaults: boolean;
  notifySimulationEvents: boolean;
}

const DEFAULTS: ElmodeSettings = {
  theme: "dark",
  temperatureUnit: "C",
  pressureUnit: "PSI",
  speedUnit: "kmh",
  notifyDiagnosticAlerts: true,
  notifyCriticalFaults: true,
  notifySimulationEvents: false,
};

const KEY = "elmode.settings.v1";

export function useSettings() {
  const [settings, setSettings] = useState<ElmodeSettings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // Corrupt/missing — fall back to defaults silently.
    }
  }, []);

  const update = useCallback(<K extends keyof ElmodeSettings>(key: K, value: ElmodeSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, update };
}

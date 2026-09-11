// hooks/useMergedTimeline.ts
"use client";

import { useEffect, useState } from "react";
import type { DiagnosticEvent } from "./useElmodeStream";
import { getLifecycleHistory, subscribeLifecycleEvents, type LifecycleEvent } from "@/lib/eventLog";

export interface TimelineEvent {
  id: string;
  timestamp: number;
  message: string;
}

/** Merges diagnostic-transition events (from the WebSocket hook) with simulator lifecycle events (start/stop/scenario), sorted chronologically. */
export function useMergedTimeline(diagnosticEvents: DiagnosticEvent[]): TimelineEvent[] {
  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>(getLifecycleHistory());

  useEffect(() => {
    setLifecycleEvents(getLifecycleHistory());
    return subscribeLifecycleEvents((event) => {
      setLifecycleEvents((prev) => [...prev, event].slice(-100));
    });
  }, []);

  const merged = [...diagnosticEvents, ...lifecycleEvents].sort((a, b) => a.timestamp - b.timestamp);
  return merged.slice(-100);
}

// hooks/useElmodeStream.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { TelemetryBroadcastMessage, TelemetrySnapshot, ChartPoint, TelemetryMetricType } from "@/types/telemetry";
import type { VehicleHealthSnapshot } from "@/types/diagnostics";
import { getLatestTelemetry, getLatestDiagnosis, WS_URL, DEFAULT_NODE_ID, BackendUnreachableError } from "@/lib/api";

const FLUSH_INTERVAL_MS = 150;
const RECONNECT_DELAY_MS = 3000;
const HISTORY_LENGTH = 60; // rolling chart window, per brief's "30-60 data points"
const STALE_THRESHOLD_MS = 5000; // no telemetry for 5s while engine should be running -> STALE

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "backend-offline";

export interface DiagnosticEvent {
  id: string;
  timestamp: number;
  message: string;
}

interface UseElmodeStreamResult {
  telemetry: TelemetrySnapshot;
  telemetryHistory: Record<TelemetryMetricType, ChartPoint[]>;
  diagnostics: VehicleHealthSnapshot | null;
  connectionStatus: ConnectionStatus;
  isTelemetryStale: boolean;
  events: DiagnosticEvent[];
  isHydrated: boolean;
}

const emptyHistory = (): Record<TelemetryMetricType, ChartPoint[]> => ({
  ENGINE_RPM: [],
  COOLANT_TEMP: [],
  ENGINE_LOAD: [],
  OIL_PRESSURE: [],
  BATTERY_VOLTAGE: [],
});

/**
 * Single source of truth for live ELMODE data: subscribes to both
 * /topic/telemetry and /topic/diagnostics, hydrates from REST on mount,
 * and derives a diagnostic event timeline from actual status transitions
 * (never fabricated) as required by the brief.
 */
export function useElmodeStream(nodeId: string = DEFAULT_NODE_ID): UseElmodeStreamResult {
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>({});
  const [telemetryHistory, setTelemetryHistory] = useState<Record<TelemetryMetricType, ChartPoint[]>>(emptyHistory());
  const [diagnostics, setDiagnostics] = useState<VehicleHealthSnapshot | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [isHydrated, setIsHydrated] = useState(false);
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [isTelemetryStale, setIsTelemetryStale] = useState(false);

  const pendingTelemetryRef = useRef<TelemetrySnapshot>({});
  const lastTelemetryAtRef = useRef<number>(0);
  const lastComponentStatusRef = useRef<Record<string, string>>({});
  const isMountedRef = useRef(true);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const staleCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushEvent = useCallback((message: string) => {
    setEvents((prev) => {
      const next: DiagnosticEvent[] = [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, timestamp: Date.now(), message },
      ];
      // Cap in-memory timeline length — no persistence requirement today per brief.
      return next.slice(-100);
    });
  }, []);

  // --- REST hydration on mount ---
  useEffect(() => {
    isMountedRef.current = true;

    (async () => {
      try {
        const [telemetryList, diagnosis] = await Promise.all([
          getLatestTelemetry(nodeId).catch(() => []),
          getLatestDiagnosis(nodeId).catch(() => null),
        ]);

        if (!isMountedRef.current) return;

        if (telemetryList.length > 0) {
          const snapshot: TelemetrySnapshot = {};
          for (const msg of telemetryList) snapshot[msg.metric] = msg;
          setTelemetry(snapshot);
          lastTelemetryAtRef.current = Date.now();
        }
        if (diagnosis) {
          setDiagnostics(diagnosis);
          for (const c of diagnosis.components) {
            lastComponentStatusRef.current[c.component] = c.status;
          }
        }
        setConnectionStatus((prev) => (prev === "connecting" ? "connecting" : prev));
      } catch (err) {
        if (!isMountedRef.current) return;
        if (err instanceof BackendUnreachableError) {
          setConnectionStatus("backend-offline");
        }
      } finally {
        if (isMountedRef.current) setIsHydrated(true);
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, [nodeId]);

  // --- STOMP connection ---
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      reconnectDelay: RECONNECT_DELAY_MS,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        if (!isMountedRef.current) return;
        setConnectionStatus("connected");

        client.subscribe("/topic/telemetry", (message: IMessage) => {
          try {
            const event: TelemetryBroadcastMessage = JSON.parse(message.body);
            if (event.nodeId !== nodeId) return;
            pendingTelemetryRef.current = { ...pendingTelemetryRef.current, [event.metric]: event };
            lastTelemetryAtRef.current = Date.now();
          } catch (e) {
            console.error("[useElmodeStream] Failed to parse telemetry frame:", e);
          }
        });

        client.subscribe("/topic/diagnostics", (message: IMessage) => {
          try {
            const snapshot: VehicleHealthSnapshot = JSON.parse(message.body);
            if (snapshot.nodeId !== nodeId) return;
            if (!isMountedRef.current) return;

            // Derive timeline events from ACTUAL status transitions only —
            // never fabricated, per brief section 6/19. Compares against the
            // last known status per component and only emits an event when
            // it genuinely changed.
            for (const c of snapshot.components) {
              const previous = lastComponentStatusRef.current[c.component];
              if (previous !== undefined && previous !== c.status) {
                const label = c.component.replace(/_/g, " ");
                pushEvent(`${label} — ${c.status}: ${c.detectedIssue}`);
              }
              lastComponentStatusRef.current[c.component] = c.status;
            }

            setDiagnostics(snapshot);
          } catch (e) {
            console.error("[useElmodeStream] Failed to parse diagnostics frame:", e);
          }
        });
      },

      onDisconnect: () => {
        if (isMountedRef.current) setConnectionStatus("disconnected");
      },
      onWebSocketClose: () => {
        if (isMountedRef.current) setConnectionStatus("disconnected");
      },
      onWebSocketError: () => {
        if (isMountedRef.current) setConnectionStatus("backend-offline");
      },
      onStompError: () => {
        if (isMountedRef.current) setConnectionStatus("disconnected");
      },
    });

    client.activate();
    setConnectionStatus("connecting");

    // Flush buffered telemetry into React state + rolling chart history on a fixed interval.
    flushIntervalRef.current = setInterval(() => {
      const pending = pendingTelemetryRef.current;
      if (Object.keys(pending).length === 0) return;
      pendingTelemetryRef.current = {};

      if (!isMountedRef.current) return;

      setTelemetry((prev) => ({ ...prev, ...pending }));
      setTelemetryHistory((prev) => {
        const next = { ...prev };
        for (const [metric, msg] of Object.entries(pending) as [TelemetryMetricType, TelemetryBroadcastMessage][]) {
          const series = next[metric] ? [...next[metric]] : [];
          series.push({ t: new Date(msg.timestamp).getTime() || Date.now(), value: msg.value });
          next[metric] = series.slice(-HISTORY_LENGTH);
        }
        return next;
      });
    }, FLUSH_INTERVAL_MS);

    // Staleness watchdog: if we've previously seen telemetry but nothing has
    // arrived in STALE_THRESHOLD_MS, flag it rather than silently continuing
    // to display old numbers as if they were live (brief section 13).
    staleCheckIntervalRef.current = setInterval(() => {
      if (lastTelemetryAtRef.current === 0) return;
      const age = Date.now() - lastTelemetryAtRef.current;
      setIsTelemetryStale(age > STALE_THRESHOLD_MS);
    }, 1000);

    return () => {
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      if (staleCheckIntervalRef.current) clearInterval(staleCheckIntervalRef.current);
      client.deactivate();
    };
  }, [nodeId, pushEvent]);

  return { telemetry, telemetryHistory, diagnostics, connectionStatus, isTelemetryStale, events, isHydrated };
}

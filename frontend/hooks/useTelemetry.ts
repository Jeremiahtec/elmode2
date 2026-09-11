// hooks/useTelemetry.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type {
  ConnectionStatus,
  TelemetrySnapshot,
  VehicleTelemetryEvent,
} from "@/types/telemetry";

const WS_ENDPOINT =
  process.env.NEXT_PUBLIC_ELMODE_WS_URL ?? "http://localhost:8080/ws-telemetry";
const REST_SNAPSHOT_URL =
  process.env.NEXT_PUBLIC_ELMODE_API_URL ?? "http://localhost:8080/api/telemetry/latest";
const TELEMETRY_TOPIC = "/topic/telemetry";


const FLUSH_INTERVAL_MS = 100;

const RECONNECT_DELAY_MS = 4000;
const HEARTBEAT_MS = 10000;

interface UseTelemetryResult {
  telemetry: TelemetrySnapshot;
  connectionStatus: ConnectionStatus;
  isHydrated: boolean;
  error: string | null;
}


export function useTelemetry(nodeId?: string): UseTelemetryResult {
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pending inbound messages since the last flush. A ref, not state —
  // mutating it does NOT trigger a re-render. Only the interval-driven
  // flush below touches React state.
  const pendingBufferRef = useRef<TelemetrySnapshot>({});
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const isMountedRef = useRef(true);

  const applyEvent = useCallback((event: VehicleTelemetryEvent) => {
    if (nodeId && event.nodeId !== nodeId) {
      return; // Ignore samples for other vehicles when a specific node is requested.
    }
    pendingBufferRef.current = {
      ...pendingBufferRef.current,
      [event.metric]: event,
    };
  }, [nodeId]);

  // --- Phase A: REST hydration on mount ---
  useEffect(() => {
    isMountedRef.current = true;

    const hydrate = async () => {
      try {
        const url = nodeId
          ? `${REST_SNAPSHOT_URL}?nodeId=${encodeURIComponent(nodeId)}`
          : REST_SNAPSHOT_URL;

        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Snapshot fetch failed: HTTP ${response.status}`);
        }

        const events: VehicleTelemetryEvent[] = await response.json();
        if (!isMountedRef.current) return;

        const snapshot: TelemetrySnapshot = {};
        for (const event of events) {
          snapshot[event.metric] = event;
        }
        setTelemetry(snapshot);
      } catch (err) {
        if (!isMountedRef.current) return;
        const message = err instanceof Error ? err.message : "Unknown hydration error";
        console.error("[useTelemetry] REST hydration failed:", message);
        setError(message);
        // Non-fatal: WebSocket stream will populate state once connected,
        // even if the initial hydration fetch failed (e.g. backend cold start).
      } finally {
        if (isMountedRef.current) {
          setIsHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      isMountedRef.current = false;
    };
  }, [nodeId]);

  // --- Phase B: STOMP connection + buffered flush loop ---
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT) as WebSocket,
      reconnectDelay: RECONNECT_DELAY_MS,
      heartbeatIncoming: HEARTBEAT_MS,
      heartbeatOutgoing: HEARTBEAT_MS,

      onConnect: () => {
        if (!isMountedRef.current) return;
        setConnectionStatus("connected");
        setError(null);

        subscriptionRef.current = client.subscribe(TELEMETRY_TOPIC, (message: IMessage) => {
          try {
            const event: VehicleTelemetryEvent = JSON.parse(message.body);
            applyEvent(event);
          } catch (parseErr) {
            console.error("[useTelemetry] Failed to parse telemetry frame:", parseErr, message.body);
          }
        });
      },

      onDisconnect: () => {
        if (!isMountedRef.current) return;
        setConnectionStatus("disconnected");
      },

      onWebSocketClose: () => {
        if (!isMountedRef.current) return;
        setConnectionStatus("disconnected");
        // stompjs will auto-retry per reconnectDelay; UI just reflects the state.
      },

      onStompError: (frame) => {
        if (!isMountedRef.current) return;
        const message = frame.headers?.message ?? "Unknown STOMP protocol error";
        console.error("[useTelemetry] STOMP broker error:", message, frame.body);
        setConnectionStatus("error");
        setError(message);
      },

      onWebSocketError: (event) => {
        if (!isMountedRef.current) return;
        console.error("[useTelemetry] WebSocket transport error:", event);
        setConnectionStatus("error");
        setError("WebSocket transport error — check that the backend is reachable.");
      },
    });

    clientRef.current = client;
    setConnectionStatus("connecting");
    client.activate();


    flushIntervalRef.current = setInterval(() => {
      const pending = pendingBufferRef.current;
      if (Object.keys(pending).length === 0) return;

      pendingBufferRef.current = {};
      if (isMountedRef.current) {
        setTelemetry((prev) => ({ ...prev, ...pending }));
      }
    }, FLUSH_INTERVAL_MS);

    return () => {
      if (flushIntervalRef.current !== null) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }

      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;

      client.deactivate();
      clientRef.current = null;
    };
  }, [applyEvent]);

  return { telemetry, connectionStatus, isHydrated, error };
}
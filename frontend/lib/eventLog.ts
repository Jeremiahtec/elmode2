// lib/eventLog.ts
//
// The dashboard's diagnostic timeline (see useElmodeStream) derives events
// from real WebSocket status transitions. Simulator lifecycle actions
// (engine start/stop, scenario changes) happen via plain REST calls and
// don't flow through that WebSocket stream, but the brief's example
// timeline includes them ("Vehicle simulation started", "Engine running").
//
// This is a minimal module-scoped pub/sub so the /simulator page can push
// a lifecycle event and the / (dashboard) page's timeline picks it up —
// without standing up a full global state library for a same-session,
// same-tab demo. Survives client-side route navigation (module stays
// loaded); does NOT survive a hard refresh, which is fine — there's no
// persistence requirement today per the brief.

export interface LifecycleEvent {
  id: string;
  timestamp: number;
  message: string;
}

const listeners = new Set<(event: LifecycleEvent) => void>();
let history: LifecycleEvent[] = [];

export function logLifecycleEvent(message: string): void {
  const event: LifecycleEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    message,
  };
  history = [...history, event].slice(-100);
  listeners.forEach((fn) => fn(event));
}

export function getLifecycleHistory(): LifecycleEvent[] {
  return history;
}

export function subscribeLifecycleEvents(fn: (event: LifecycleEvent) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

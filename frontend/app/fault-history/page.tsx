// app/fault-history/page.tsx
"use client";

import { useElmodeStream } from "@/hooks/useElmodeStream";
import { useMergedTimeline } from "@/hooks/useMergedTimeline";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ConnectionBanner } from "@/components/ConnectionBanner";

function FaultHistoryContent() {
  const { connectionStatus, isTelemetryStale, events } = useElmodeStream();
  const timeline = useMergedTimeline(events);

  // Faults = timeline entries that mention a WARNING/CRITICAL transition.
  // This is a light heuristic over the same in-memory event log the
  // dashboard timeline uses — there's no persisted fault table yet (see
  // known limitations), so "history" here means "this session's events."
  const faults = [...timeline].reverse().filter((e) => /WARNING|CRITICAL/i.test(e.message));

  return (
    <AppShell connectionStatus={connectionStatus}>
      <ConnectionBanner status={connectionStatus} isStale={isTelemetryStale} />

      <div className="border-b border-graphite-700 px-8 py-5">
        <div className="font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">Fault History</div>
        <div className="text-lg font-semibold text-white">Session Fault Log</div>
        <p className="mt-1 max-w-xl text-[12px] text-graphite-500">
          Faults detected during this session. Not yet persisted to a database — history resets on page reload
          (see Known Limitations).
        </p>
      </div>

      <div className="p-8">
        {faults.length === 0 ? (
          <div className="rounded-md border border-graphite-700 bg-graphite-850 px-6 py-10 text-center font-mono text-xs text-graphite-500">
            No faults recorded this session.
          </div>
        ) : (
          <div className="divide-y divide-graphite-800 border-y border-graphite-800">
            {faults.map((f) => (
              <div key={f.id} className="flex items-start gap-4 py-4">
                <div className="w-20 shrink-0 font-mono text-[11px] tabular-nums text-graphite-500">
                  {new Date(f.timestamp).toLocaleTimeString(undefined, { hour12: false })}
                </div>
                <div className="text-[13px] text-graphite-200">{f.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function FaultHistoryPage() {
  return (
    <RequireAuth>
      <FaultHistoryContent />
    </RequireAuth>
  );
}

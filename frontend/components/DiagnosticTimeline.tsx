// components/DiagnosticTimeline.tsx

interface TimelineEventLike {
  id: string;
  timestamp: number;
  message: string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour12: false });
}

export function DiagnosticTimeline({ events }: { events: TimelineEventLike[] }) {
  const ordered = [...events].reverse(); // most recent first

  return (
    <div>
      <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest2 text-graphite-400">
        Diagnostic Event Timeline
      </div>

      {ordered.length === 0 ? (
        <div className="py-4 font-mono text-xs text-graphite-600">
          No events yet. Timeline populates as component status changes.
        </div>
      ) : (
        <ol className="flex max-h-32 flex-col gap-2 overflow-y-auto pr-1">
          {ordered.slice(0, 8).map((event) => (
            <li key={event.id} className="flex items-baseline gap-3 border-l-2 border-graphite-700 pl-3">
              <div className="shrink-0 font-mono text-[10px] tabular-nums text-graphite-600">
                {formatTime(event.timestamp)}
              </div>
              <div className="text-[12px] leading-relaxed text-graphite-300">{event.message}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

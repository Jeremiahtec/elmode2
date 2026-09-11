// components/StatusBadge.tsx
import type { DegradationStatus } from "@/types/telemetry";
import { STATUS_LABEL } from "@/lib/metricDisplay";

const STYLES: Record<DegradationStatus, string> = {
  INFO: "bg-status-healthy/10 text-status-healthy border-status-healthy/30",
  WARNING: "bg-status-warning/10 text-status-warning border-status-warning/30",
  CRITICAL: "bg-status-critical/10 text-status-critical border-status-critical/40",
};

export function StatusBadge({ status, className = "" }: { status: DegradationStatus; className?: string }) {
  const pulse = status === "CRITICAL" ? "pulse-critical" : "";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-mono font-semibold tracking-wider ${STYLES[status]} ${pulse} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

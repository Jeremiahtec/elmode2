// components/gauges/RadialGauge.tsx
"use client";

interface RadialGaugeProps {
  value: number;
  min: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  sweepDegrees?: number;
  children?: React.ReactNode;
}

/**
 * A single SVG arc gauge, used for every dial in the redesign (RPM,
 * coolant, oil pressure, battery, overall health). Hand-rolled rather than
 * a charting library so the stroke stays crisp at any size and matches the
 * status color system exactly.
 */
export function RadialGauge({
  value,
  min,
  max,
  size = 120,
  strokeWidth = 8,
  color,
  trackColor = "#2a3038",
  sweepDegrees = 270,
  children,
}: RadialGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (sweepDegrees / 360) * circumference;
  const clamped = Math.max(min, Math.min(max, value));
  const fraction = (clamped - min) / (max - min || 1);
  const fillLength = arcLength * fraction;

  const startAngle = 90 + (360 - sweepDegrees) / 2;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${fillLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${center} ${center})`}
          style={{ transition: "stroke-dasharray 0.3s ease-out, stroke 0.4s ease-out" }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
    </div>
  );
}

package com.elmode.diagnostics.model;

import com.elmode.telemetry.model.DegradationStatus;

import java.time.Instant;

/**
 * A single component's diagnostic conclusion, including the reasoning that
 * produced it. This is the core anti-"just a red/green light" requirement —
 * every field here exists so the frontend can render an explanation, not
 * just a status badge.
 */
public record ComponentDiagnosis(
        VehicleComponent component,
        DegradationStatus status,
        int healthPercent,
        String detectedIssue,
        double observedValue,
        String observedUnit,
        String safeRangeDescription,
        String recommendedAction,
        Instant lastUpdated
) {
}

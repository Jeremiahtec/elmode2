package com.elmode.diagnostics.model;

import com.elmode.telemetry.model.DegradationStatus;

import java.time.Instant;
import java.util.List;

/**
 * Full diagnostic snapshot for a vehicle node: every component's diagnosis
 * plus a deterministic overall health score and status. This is the shape
 * returned by GET /api/diagnostics/{nodeId} and broadcast over
 * /topic/diagnostics.
 */
public record VehicleHealthSnapshot(
        String nodeId,
        int overallHealthPercent,
        DegradationStatus overallStatus,
        List<ComponentDiagnosis> components,
        Instant evaluatedAt
) {
}

package com.elmode.ingestion.model;

import java.time.Instant;


public record VehicleTelemetryEvent(
        String nodeId,
        TelemetryMetric metric,
        double value,
        Instant timestamp,
        TelemetrySource source
) {
    public VehicleTelemetryEvent {
        if (nodeId == null || nodeId.isBlank()) {
            throw new IllegalArgumentException("nodeId must not be blank");
        }
        if (metric == null) {
            throw new IllegalArgumentException("metric must not be null");
        }
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }

    public enum TelemetrySource {
        HARDWARE,
        MOCK
    }
}
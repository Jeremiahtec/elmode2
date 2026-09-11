package com.elmode.telemetry.model;

import com.elmode.ingestion.model.TelemetryMetric;
import com.elmode.ingestion.model.VehicleTelemetryEvent;

import java.time.Instant;


public record TelemetryBroadcastMessage(
        String nodeId,
        TelemetryMetric metric,
        double value,
        String unit,
        Instant timestamp,
        DegradationStatus status,
        String source
) {
    public static TelemetryBroadcastMessage from(VehicleTelemetryEvent event, DegradationStatus status) {
        return new TelemetryBroadcastMessage(
                event.nodeId(),
                event.metric(),
                event.value(),
                event.metric().unit(),
                event.timestamp(),
                status,
                event.source().name()
        );
    }
}
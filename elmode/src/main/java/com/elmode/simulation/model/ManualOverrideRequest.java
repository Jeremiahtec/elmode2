package com.elmode.simulation.model;

import com.elmode.ingestion.model.TelemetryMetric;
import jakarta.validation.constraints.NotNull;

/** Body for POST /api/simulation/override — sets or clears one metric's manual slider value. */
public record ManualOverrideRequest(
        @NotNull TelemetryMetric metric,
        Double value // null = clear the override for this metric
) {
}

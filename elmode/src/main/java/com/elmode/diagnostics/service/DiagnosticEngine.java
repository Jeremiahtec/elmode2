package com.elmode.diagnostics.service;

import com.elmode.diagnostics.model.ComponentDiagnosis;
import com.elmode.diagnostics.model.VehicleComponent;
import com.elmode.diagnostics.model.VehicleHealthSnapshot;
import com.elmode.ingestion.model.TelemetryMetric;
import com.elmode.telemetry.model.DegradationStatus;
import com.elmode.telemetry.model.TelemetryBroadcastMessage;
import com.elmode.telemetry.service.TelemetryStateStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Deterministic, rule-based diagnostic reasoning engine.
 * <p>
 * DESIGN PRINCIPLE (matches the defense brief explicitly): every diagnosis
 * is derived from the actual latest telemetry value against a fixed,
 * documented threshold — never randomized, never a black box. The same
 * input telemetry always produces the same diagnosis. This is what lets you
 * explain the architecture in your defense: "the backend decides, using
 * these specific rules; the frontend only displays what the backend
 * concluded."
 * <p>
 * Reuses the SAME threshold semantics as {@link com.elmode.telemetry.service.DegradationEvaluator}
 * (kept here as a second, explanation-carrying evaluation rather than
 * calling that class directly, since this needs per-metric prose + safe
 * range strings + recommended actions that DegradationEvaluator doesn't
 * produce — duplicated threshold constants are intentional and documented
 * inline so the numbers are easy to audit/defend against the other class).
 */
@Component
public class DiagnosticEngine {

    private static final Logger log = LoggerFactory.getLogger(DiagnosticEngine.class);

    private final TelemetryStateStore stateStore;

    // --- Cooling system thresholds (°C) ---
    private static final double COOLANT_WARNING_C = 100.0;
    private static final double COOLANT_CRITICAL_C = 112.0;
    private static final double COOLANT_SAFE_MIN_C = 85.0;
    private static final double COOLANT_SAFE_MAX_C = 100.0;

    // --- Lubrication system thresholds (PSI) — low is bad ---
    private static final double OIL_PRESSURE_WARNING_PSI = 25.0;
    private static final double OIL_PRESSURE_CRITICAL_PSI = 15.0;
    private static final double OIL_PRESSURE_SAFE_MIN = 25.0;
    private static final double OIL_PRESSURE_SAFE_MAX = 65.0;

    // --- Battery/charging thresholds (V) — low is bad ---
    private static final double BATTERY_WARNING_V = 12.6;
    private static final double BATTERY_CRITICAL_V = 12.0;
    private static final double BATTERY_SAFE_MIN_V = 13.0;
    private static final double BATTERY_SAFE_MAX_V = 14.7;

    // --- Engine (RPM/load) thresholds ---
    private static final double RPM_WARNING = 6000.0;
    private static final double RPM_CRITICAL = 6800.0;
    private static final double LOAD_WARNING = 90.0;
    private static final double LOAD_CRITICAL = 98.0;

    public DiagnosticEngine(TelemetryStateStore stateStore) {
        this.stateStore = stateStore;
    }

    /**
     * Evaluates every component for a given vehicle node from the latest
     * known telemetry in {@link TelemetryStateStore}. Returns a snapshot
     * even if some metrics are missing (e.g. before the first sample
     * arrives) — components with no data report INFO/100% rather than
     * throwing, so the dashboard never crashes on cold start.
     */
    public VehicleHealthSnapshot evaluate(String nodeId) {
        TelemetryBroadcastMessage rpm = stateStore.getLatest(nodeId, TelemetryMetric.ENGINE_RPM);
        TelemetryBroadcastMessage load = stateStore.getLatest(nodeId, TelemetryMetric.ENGINE_LOAD);
        TelemetryBroadcastMessage coolant = stateStore.getLatest(nodeId, TelemetryMetric.COOLANT_TEMP);
        TelemetryBroadcastMessage oil = stateStore.getLatest(nodeId, TelemetryMetric.OIL_PRESSURE);
        TelemetryBroadcastMessage battery = stateStore.getLatest(nodeId, TelemetryMetric.BATTERY_VOLTAGE);

        List<ComponentDiagnosis> components = new ArrayList<>();
        components.add(diagnoseEngine(rpm, load));
        components.add(diagnoseCoolingSystem(coolant));
        components.add(diagnoseLubricationSystem(oil, rpm));
        components.add(diagnoseBatterySystem(battery));

        int overallHealth = components.stream()
                .mapToInt(ComponentDiagnosis::healthPercent)
                .min()
                .orElse(100);
        // Overall status mirrors the worst individual component — a single
        // CRITICAL system makes the vehicle CRITICAL overall, regardless of
        // how healthy everything else is. Deterministic, explainable rule.
        DegradationStatus overallStatus = components.stream()
                .map(ComponentDiagnosis::status)
                .max(DiagnosticEngine::severityRank)
                .orElse(DegradationStatus.INFO);

        return new VehicleHealthSnapshot(nodeId, overallHealth, overallStatus, components, Instant.now());
    }

    private ComponentDiagnosis diagnoseCoolingSystem(TelemetryBroadcastMessage coolant) {
        if (coolant == null) {
            return noDataDiagnosis(VehicleComponent.COOLING_SYSTEM, "celsius");
        }

        double value = coolant.value();
        DegradationStatus status = value >= COOLANT_CRITICAL_C ? DegradationStatus.CRITICAL
                : value >= COOLANT_WARNING_C ? DegradationStatus.WARNING
                : DegradationStatus.INFO;

        String issue;
        String action;
        int health;

        switch (status) {
            case CRITICAL -> {
                issue = "Coolant temperature has exceeded the safe operating threshold.";
                action = "Inspect coolant level, radiator, thermostat and cooling fan. Stop the engine if temperature continues to rise.";
                health = healthFromOverage(value, COOLANT_CRITICAL_C, COOLANT_SAFE_MAX_C, 0, 30);
            }
            case WARNING -> {
                issue = "Coolant temperature is elevated above the normal operating band.";
                action = "Monitor closely; check coolant level and radiator airflow if the trend continues.";
                health = healthFromOverage(value, COOLANT_WARNING_C, COOLANT_CRITICAL_C, 31, 70);
            }
            default -> {
                issue = "Coolant temperature is within the normal operating range.";
                action = "No action required.";
                health = 100;
            }
        }

        return new ComponentDiagnosis(
                VehicleComponent.COOLING_SYSTEM, status, health, issue,
                value, "celsius",
                String.format("%.0f–%.0f°C", COOLANT_SAFE_MIN_C, COOLANT_SAFE_MAX_C),
                action, coolant.timestamp()
        );
    }

    private ComponentDiagnosis diagnoseLubricationSystem(TelemetryBroadcastMessage oil, TelemetryBroadcastMessage rpm) {
        if (oil == null) {
            return noDataDiagnosis(VehicleComponent.LUBRICATION_SYSTEM, "psi");
        }

        double value = oil.value();
        boolean engineElevated = rpm != null && rpm.value() > 1500;

        DegradationStatus status = value <= OIL_PRESSURE_CRITICAL_PSI ? DegradationStatus.CRITICAL
                : value <= OIL_PRESSURE_WARNING_PSI ? DegradationStatus.WARNING
                : DegradationStatus.INFO;

        String issue;
        String action;
        int health;

        switch (status) {
            case CRITICAL -> {
                issue = engineElevated
                        ? "Oil pressure has remained below the safe operating threshold while engine RPM is elevated."
                        : "Oil pressure is critically low.";
                action = "Stop the engine as soon as safely possible. Check oil level and oil pump/pressure sensor before restarting.";
                health = healthFromUnderage(value, OIL_PRESSURE_CRITICAL_PSI, 0, 0, 30);
            }
            case WARNING -> {
                issue = "Oil pressure is below the normal operating band.";
                action = "Check oil level at next stop. Avoid sustained high RPM until resolved.";
                health = healthFromUnderage(value, OIL_PRESSURE_WARNING_PSI, OIL_PRESSURE_CRITICAL_PSI, 31, 70);
            }
            default -> {
                issue = "Oil pressure is within the normal operating range.";
                action = "No action required.";
                health = 100;
            }
        }

        return new ComponentDiagnosis(
                VehicleComponent.LUBRICATION_SYSTEM, status, health, issue,
                value, "psi",
                String.format("%.0f–%.0f PSI", OIL_PRESSURE_SAFE_MIN, OIL_PRESSURE_SAFE_MAX),
                action, oil.timestamp()
        );
    }

    private ComponentDiagnosis diagnoseBatterySystem(TelemetryBroadcastMessage battery) {
        if (battery == null) {
            return noDataDiagnosis(VehicleComponent.BATTERY_CHARGING_SYSTEM, "volts");
        }

        double value = battery.value();
        DegradationStatus status = value <= BATTERY_CRITICAL_V ? DegradationStatus.CRITICAL
                : value <= BATTERY_WARNING_V ? DegradationStatus.WARNING
                : DegradationStatus.INFO;

        String issue;
        String action;
        int health;

        switch (status) {
            case CRITICAL -> {
                issue = "Battery/charging voltage has dropped to a critically low level.";
                action = "Inspect alternator output and battery condition. Vehicle may fail to start on next attempt.";
                health = healthFromUnderage(value, BATTERY_CRITICAL_V, 9.0, 0, 30);
            }
            case WARNING -> {
                issue = "Battery/charging voltage is below the healthy operating band.";
                action = "Check alternator belt and battery terminals. Consider a battery/charging system test.";
                health = healthFromUnderage(value, BATTERY_WARNING_V, BATTERY_CRITICAL_V, 31, 70);
            }
            default -> {
                issue = "Battery/charging voltage is within the normal operating range.";
                action = "No action required.";
                health = 100;
            }
        }

        return new ComponentDiagnosis(
                VehicleComponent.BATTERY_CHARGING_SYSTEM, status, health, issue,
                value, "volts",
                String.format("%.1f–%.1fV", BATTERY_SAFE_MIN_V, BATTERY_SAFE_MAX_V),
                action, battery.timestamp()
        );
    }

    private ComponentDiagnosis diagnoseEngine(TelemetryBroadcastMessage rpm, TelemetryBroadcastMessage load) {
        if (rpm == null && load == null) {
            return noDataDiagnosis(VehicleComponent.ENGINE, "rpm");
        }

        double rpmValue = rpm != null ? rpm.value() : 0;
        double loadValue = load != null ? load.value() : 0;

        boolean rpmCritical = rpmValue >= RPM_CRITICAL;
        boolean rpmWarning = rpmValue >= RPM_WARNING;
        boolean loadCritical = loadValue >= LOAD_CRITICAL;
        boolean loadWarning = loadValue >= LOAD_WARNING;

        DegradationStatus status = (rpmCritical || loadCritical) ? DegradationStatus.CRITICAL
                : (rpmWarning || loadWarning) ? DegradationStatus.WARNING
                : DegradationStatus.INFO;

        String issue;
        String action;
        int health;

        switch (status) {
            case CRITICAL -> {
                issue = rpmCritical
                        ? "Engine RPM has exceeded the safe redline threshold."
                        : "Engine load has remained near maximum capacity.";
                action = "Reduce throttle input immediately.";
                health = 20;
            }
            case WARNING -> {
                issue = rpmWarning
                        ? "Engine RPM is approaching the redline threshold."
                        : "Engine load is elevated above the normal operating band.";
                action = "Monitor engine behavior; avoid sustained high-RPM operation.";
                health = 65;
            }
            default -> {
                issue = "Engine RPM and load are within normal operating parameters.";
                action = "No action required.";
                health = 100;
            }
        }

        return new ComponentDiagnosis(
                VehicleComponent.ENGINE, status, health, issue,
                rpmValue, "rpm",
                String.format("%.0f–%.0f RPM", 700.0, RPM_WARNING),
                action, rpm != null ? rpm.timestamp() : load.timestamp()
        );
    }

    private ComponentDiagnosis noDataDiagnosis(VehicleComponent component, String unit) {
        return new ComponentDiagnosis(
                component, DegradationStatus.INFO, 100,
                "No telemetry received yet.", 0, unit, "—", "Awaiting data.", Instant.now()
        );
    }

    /** Linear health mapping for a value that has exceeded a "high is bad" threshold. Higher overage = lower health. */
    private static int healthFromOverage(double value, double thresholdStart, double referenceMax, int healthFloor, int healthCeiling) {
        double span = Math.max(1.0, referenceMax - thresholdStart);
        double overage = Math.max(0, value - thresholdStart);
        double fraction = Math.min(1.0, overage / span);
        return (int) Math.round(healthCeiling - fraction * (healthCeiling - healthFloor));
    }

    /** Linear health mapping for a value that has dropped below a "low is bad" threshold. Larger shortfall = lower health. */
    private static int healthFromUnderage(double value, double thresholdStart, double referenceMin, int healthFloor, int healthCeiling) {
        double span = Math.max(1.0, thresholdStart - referenceMin);
        double shortfall = Math.max(0, thresholdStart - value);
        double fraction = Math.min(1.0, shortfall / span);
        return (int) Math.round(healthCeiling - fraction * (healthCeiling - healthFloor));
    }

    private static int severityRank(DegradationStatus a, DegradationStatus b) {
        return Integer.compare(rank(a), rank(b));
    }

    private static int rank(DegradationStatus status) {
        return switch (status) {
            case INFO -> 0;
            case WARNING -> 1;
            case CRITICAL -> 2;
        };
    }
}

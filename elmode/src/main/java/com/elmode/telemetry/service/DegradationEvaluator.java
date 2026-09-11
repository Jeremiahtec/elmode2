package com.elmode.telemetry.service;

import com.elmode.ingestion.model.TelemetryMetric;
import com.elmode.ingestion.model.VehicleTelemetryEvent;
import com.elmode.telemetry.model.DegradationStatus;
import org.springframework.stereotype.Component;


@Component
public class DegradationEvaluator {

    // Coolant temp thresholds (°C) — based on typical warning/redline zones.
    private static final double COOLANT_WARNING_C = 105.0;
    private static final double COOLANT_CRITICAL_C = 115.0;

    // RPM thresholds — sustained near-redline operation is the risk signal, not a brief spike.
    private static final double RPM_WARNING = 6000.0;
    private static final double RPM_CRITICAL = 6800.0;

    // Engine load thresholds (%) — sustained high load correlates with accelerated wear.
    private static final double LOAD_WARNING = 90.0;
    private static final double LOAD_CRITICAL = 98.0;

    // Oil pressure thresholds (PSI) — LOW is the fault direction here, unlike
    // the metrics above. Typical passenger-vehicle safe idle/running range is
    // roughly 25-65 PSI; below ~25 is a lubrication warning, below ~15 is
    // critical (risk of bearing/engine damage).
    private static final double OIL_PRESSURE_WARNING = 25.0;
    private static final double OIL_PRESSURE_CRITICAL = 15.0;

    // Battery/charging voltage thresholds (V) — also LOW-is-bad. A healthy
    // running engine's charging system should hold ~13.5-14.7V; below 12.4V
    // suggests a discharged/failing battery, below 11.8V is critical.
    private static final double BATTERY_VOLTAGE_WARNING = 12.4;
    private static final double BATTERY_VOLTAGE_CRITICAL = 11.8;

    public DegradationStatus evaluate(VehicleTelemetryEvent event) {
        TelemetryMetric metric = event.metric();
        double value = event.value();

        return switch (metric) {
            case COOLANT_TEMP -> classifyHighIsBad(value, COOLANT_WARNING_C, COOLANT_CRITICAL_C);
            case ENGINE_RPM -> classifyHighIsBad(value, RPM_WARNING, RPM_CRITICAL);
            case ENGINE_LOAD -> classifyHighIsBad(value, LOAD_WARNING, LOAD_CRITICAL);
            case OIL_PRESSURE -> classifyLowIsBad(value, OIL_PRESSURE_WARNING, OIL_PRESSURE_CRITICAL);
            case BATTERY_VOLTAGE -> classifyLowIsBad(value, BATTERY_VOLTAGE_WARNING, BATTERY_VOLTAGE_CRITICAL);
        };
    }

    /** For metrics where an elevated value indicates degradation (temp, RPM, load). */
    private DegradationStatus classifyHighIsBad(double value, double warningThreshold, double criticalThreshold) {
        if (value >= criticalThreshold) {
            return DegradationStatus.CRITICAL;
        }
        if (value >= warningThreshold) {
            return DegradationStatus.WARNING;
        }
        return DegradationStatus.INFO;
    }

    /** For metrics where a depressed value indicates degradation (oil pressure, battery voltage). */
    private DegradationStatus classifyLowIsBad(double value, double warningThreshold, double criticalThreshold) {
        if (value <= criticalThreshold) {
            return DegradationStatus.CRITICAL;
        }
        if (value <= warningThreshold) {
            return DegradationStatus.WARNING;
        }
        return DegradationStatus.INFO;
    }
}
package com.elmode.ingestion.model;

/**
 * Telemetry metrics tracked by ELMODE.
 * <p>
 * ENGINE_RPM, COOLANT_TEMP, and ENGINE_LOAD are standard SAE J1979 Mode 01
 * PIDs, readable from real ELM327 hardware (see Elm327ResponseParser).
 * <p>
 * OIL_PRESSURE and BATTERY_VOLTAGE are NOT standard OBD-II Mode 01 PIDs —
 * most consumer vehicles don't expose these over the generic OBD-II bus at
 * all (oil pressure in particular is often a binary switch, not a PID; where
 * available it's usually manufacturer-specific Mode 22). They're included
 * here as simulation-only metrics for the diagnostic engine and defense
 * demo. Their "pid" values are placeholders and are NOT sent to real
 * hardware — Elm327ResponseParser only ever decodes ENGINE_RPM/COOLANT_TEMP/
 * ENGINE_LOAD, so these two are safe no-ops on the real hardware path.
 */
public enum TelemetryMetric {

    ENGINE_RPM("010C", "rpm", 0, 8000),
    COOLANT_TEMP("0105", "celsius", -40, 215),
    ENGINE_LOAD("0104", "percent", 0, 100),

    // --- Simulation-only (see class javadoc) ---
    OIL_PRESSURE("SIM_OIL_PSI", "psi", 0, 100),
    BATTERY_VOLTAGE("SIM_BATT_V", "volts", 0, 16);

    private final String pid;
    private final String unit;
    private final double minPlausible;
    private final double maxPlausible;

    TelemetryMetric(String pid, String unit, double minPlausible, double maxPlausible) {
        this.pid = pid;
        this.unit = unit;
        this.minPlausible = minPlausible;
        this.maxPlausible = maxPlausible;
    }

    public String pid() {
        return pid;
    }

    public String unit() {
        return unit;
    }

    public double minPlausible() {
        return minPlausible;
    }

    public double maxPlausible() {
        return maxPlausible;
    }
}
package com.elmode.simulation.model;

/**
 * The five named demo scenarios required for the defense presentation.
 * Each scenario drives {@link com.elmode.simulation.service.ScenarioTelemetryGenerator}
 * toward a specific target state via gradual interpolation, not instant jumps.
 */
public enum SimulationScenario {
    HEALTHY,
    OVERHEATING,
    LOW_OIL_PRESSURE,
    WEAK_BATTERY,
    MULTIPLE_FAULTS
}

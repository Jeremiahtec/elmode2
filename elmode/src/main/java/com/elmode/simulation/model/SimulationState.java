package com.elmode.simulation.model;

/**
 * Coarse run-state of the virtual vehicle, controlled from the Simulator
 * Control page. ENGINE_OFF suppresses telemetry generation entirely (no
 * samples published) — matches the real-world expectation that an OBD-II
 * bus goes quiet without ignition power.
 */
public enum SimulationState {
    ENGINE_OFF,
    ENGINE_ON_IDLE,
    RUNNING
}

package com.elmode.simulation.model;

/** Response for GET /api/simulation/status — drives the Simulator Control page's current-state display. */
public record SimulationStatusResponse(
        boolean mockModeAvailable,
        boolean engineRunning,
        SimulationScenario activeScenario,
        double speedMultiplier
) {
}

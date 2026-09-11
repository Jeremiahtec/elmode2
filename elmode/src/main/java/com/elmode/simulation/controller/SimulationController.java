package com.elmode.simulation.controller;

import com.elmode.ingestion.service.ObdReaderService;
import com.elmode.simulation.model.ManualOverrideRequest;
import com.elmode.simulation.model.SimulationScenario;
import com.elmode.simulation.model.SimulationStatusResponse;
import com.elmode.simulation.service.ScenarioTelemetryGenerator;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controls for the defense-demo virtual vehicle: engine on/off, scenario
 * selection, playback speed, and manual fault-injection overrides.
 * <p>
 * All endpoints are no-ops (return 409) if the backend isn't running in
 * mock mode (obd.mock.enabled=false) — simulation controls have no meaning
 * against real hardware, and we'd rather fail loudly here than silently
 * ignore a control action during a live demo.
 */
@RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = "${elmode.cors.allowed-origins:http://localhost:3000}")
public class SimulationController {

    private static final Logger log = LoggerFactory.getLogger(SimulationController.class);

    private final ObdReaderService obdReaderService;

    public SimulationController(ObdReaderService obdReaderService) {
        this.obdReaderService = obdReaderService;
    }

    @GetMapping("/status")
    public ResponseEntity<SimulationStatusResponse> getStatus() {
        ScenarioTelemetryGenerator generator = obdReaderService.getScenarioGenerator();
        boolean available = obdReaderService.isMockMode() && generator != null;

        return ResponseEntity.ok(new SimulationStatusResponse(
                available,
                obdReaderService.isEngineRunning(),
                available ? generator.getActiveScenario() : SimulationScenario.HEALTHY,
                1.0
        ));
    }

    @PostMapping("/engine/start")
    public ResponseEntity<Void> startEngine() {
        if (!requireMockMode()) return ResponseEntity.status(409).build();
        obdReaderService.setEngineRunning(true);
        log.info("[SimulationController] Engine started");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/engine/stop")
    public ResponseEntity<Void> stopEngine() {
        if (!requireMockMode()) return ResponseEntity.status(409).build();
        obdReaderService.setEngineRunning(false);
        log.info("[SimulationController] Engine stopped");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/scenario/{scenario}")
    public ResponseEntity<Void> selectScenario(@PathVariable SimulationScenario scenario) {
        ScenarioTelemetryGenerator generator = requireGenerator();
        if (generator == null) return ResponseEntity.status(409).build();
        generator.selectScenario(scenario);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/speed/{multiplier}")
    public ResponseEntity<Void> setSpeed(@PathVariable double multiplier) {
        ScenarioTelemetryGenerator generator = requireGenerator();
        if (generator == null) return ResponseEntity.status(409).build();
        generator.setSpeedMultiplier(multiplier);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/override")
    public ResponseEntity<Void> setManualOverride(@Valid @RequestBody ManualOverrideRequest request) {
        ScenarioTelemetryGenerator generator = requireGenerator();
        if (generator == null) return ResponseEntity.status(409).build();

        if (request.value() == null) {
            generator.clearManualOverride(request.metric());
        } else {
            generator.setManualOverride(request.metric(), request.value());
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/override/clear-all")
    public ResponseEntity<Void> clearAllOverrides() {
        ScenarioTelemetryGenerator generator = requireGenerator();
        if (generator == null) return ResponseEntity.status(409).build();
        generator.clearAllManualOverrides();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset")
    public ResponseEntity<Void> reset() {
        ScenarioTelemetryGenerator generator = requireGenerator();
        if (generator == null) return ResponseEntity.status(409).build();
        generator.reset();
        obdReaderService.setEngineRunning(false);
        log.info("[SimulationController] Simulation reset");
        return ResponseEntity.ok().build();
    }

    private boolean requireMockMode() {
        if (!obdReaderService.isMockMode()) {
            log.warn("[SimulationController] Rejected control action — backend is not in mock mode (obd.mock.enabled=false)");
            return false;
        }
        return true;
    }

    private ScenarioTelemetryGenerator requireGenerator() {
        if (!obdReaderService.isMockMode()) {
            log.warn("[SimulationController] Rejected control action — backend is not in mock mode");
            return null;
        }
        return obdReaderService.getScenarioGenerator();
    }
}

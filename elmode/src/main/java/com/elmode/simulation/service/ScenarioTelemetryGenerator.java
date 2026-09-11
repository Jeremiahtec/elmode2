package com.elmode.simulation.service;

import com.elmode.ingestion.model.TelemetryMetric;
import com.elmode.ingestion.model.VehicleTelemetryEvent;
import com.elmode.ingestion.model.VehicleTelemetryEvent.TelemetrySource;
import com.elmode.simulation.model.SimulationScenario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Generates gradually-evolving, scenario-driven telemetry for the defense
 * demo. This is the successor to MockTelemetrySimulator for presentation
 * purposes — same "no instant jumps, small correlated fluctuations" design
 * philosophy, but with:
 *   - Five selectable named scenarios, each with a distinct target state
 *   - Exponential approach toward the scenario's target (never a step change)
 *   - A manual-override layer (sliders) that takes priority per-metric when set
 *   - A speed multiplier so the approach can be sped up for a live demo
 *
 * Thread-safety: all mutable state is behind either AtomicReference or is
 * only ever touched from the single ingestion polling thread that calls
 * nextSample(). Control methods (selectScenario, setManualOverride, etc.)
 * are called from HTTP request threads and only ever write plain volatile-
 * backed fields or AtomicReferences — no read-modify-write races with the
 * polling thread's per-tick advance methods, since those always fully
 * recompute from current values rather than depending on external state
 * staying constant mid-tick.
 */
public class ScenarioTelemetryGenerator {

    private static final Logger log = LoggerFactory.getLogger(ScenarioTelemetryGenerator.class);

    private final String nodeId;

    // --- Control state (written by REST controller thread, read by polling thread) ---
    private volatile SimulationScenario activeScenario = SimulationScenario.HEALTHY;
    private volatile double speedMultiplier = 1.0;
    private final AtomicReference<Map<TelemetryMetric, Double>> manualOverrides =
            new AtomicReference<>(Map.of());

    // --- Live simulated values (only ever touched from the polling thread) ---
    private double rpm = IDLE_RPM;
    private double coolantTemp = COLD_START_TEMP_C;
    private double engineLoad = 15.0;
    private double oilPressure = HEALTHY_OIL_PSI;
    private double batteryVoltage = HEALTHY_BATTERY_V;
    private double throttlePhase = 0.0;

    // --- Baselines ---
    private static final double IDLE_RPM = 800.0;
    private static final double CRUISE_RPM = 2200.0;
    private static final double COLD_START_TEMP_C = 20.0;
    private static final double HEALTHY_OPERATING_TEMP_C = 90.0;
    private static final double HEALTHY_OIL_PSI = 50.0;
    private static final double HEALTHY_BATTERY_V = 14.2;

    // --- Scenario target states ---
    private static final double OVERHEAT_TARGET_TEMP_C = 118.0;
    private static final double LOW_OIL_TARGET_PSI = 12.0;
    private static final double WEAK_BATTERY_TARGET_V = 11.5;

    public ScenarioTelemetryGenerator(String nodeId) {
        this.nodeId = nodeId;
        log.info("ScenarioTelemetryGenerator initialized for node [{}]", nodeId);
    }

    // ---------- Control surface (called from SimulationController) ----------

    public void selectScenario(SimulationScenario scenario) {
        log.info("Simulation scenario changed: {} -> {}", activeScenario, scenario);
        this.activeScenario = scenario;
    }

    public SimulationScenario getActiveScenario() {
        return activeScenario;
    }

    public void setSpeedMultiplier(double multiplier) {
        this.speedMultiplier = Math.max(0.1, Math.min(multiplier, 20.0));
        log.info("Simulation speed set to {}x", this.speedMultiplier);
    }

    /**
     * Sets a manual override for a specific metric — takes priority over
     * scenario-driven targets for that metric until cleared. Used by the
     * fault-injection sliders on the Simulator Control page.
     */
    public void setManualOverride(TelemetryMetric metric, double value) {
        manualOverrides.updateAndGet(current -> {
            var updated = new java.util.HashMap<>(current);
            updated.put(metric, value);
            return Map.copyOf(updated);
        });
        log.info("Manual override set: {} = {}", metric, value);
    }

    public void clearManualOverride(TelemetryMetric metric) {
        manualOverrides.updateAndGet(current -> {
            var updated = new java.util.HashMap<>(current);
            updated.remove(metric);
            return Map.copyOf(updated);
        });
    }

    public void clearAllManualOverrides() {
        manualOverrides.set(Map.of());
        log.info("All manual overrides cleared");
    }

    /** Resets every simulated value back to cold-start healthy baselines. */
    public void reset() {
        rpm = IDLE_RPM;
        coolantTemp = COLD_START_TEMP_C;
        engineLoad = 15.0;
        oilPressure = HEALTHY_OIL_PSI;
        batteryVoltage = HEALTHY_BATTERY_V;
        throttlePhase = 0.0;
        activeScenario = SimulationScenario.HEALTHY;
        clearAllManualOverrides();
        log.info("Simulation reset to cold-start healthy baseline");
    }

    // ---------- Per-tick sample generation (polling thread only) ----------

    public List<VehicleTelemetryEvent> nextSample() {
        Instant now = Instant.now();
        Map<TelemetryMetric, Double> overrides = manualOverrides.get();

        advanceRpmAndLoad(overrides);
        advanceCoolantTemp(overrides);
        advanceOilPressure(overrides);
        advanceBatteryVoltage(overrides);

        return List.of(
                new VehicleTelemetryEvent(nodeId, TelemetryMetric.ENGINE_RPM, round0(rpm), now, TelemetrySource.MOCK),
                new VehicleTelemetryEvent(nodeId, TelemetryMetric.COOLANT_TEMP, round1(coolantTemp), now, TelemetrySource.MOCK),
                new VehicleTelemetryEvent(nodeId, TelemetryMetric.ENGINE_LOAD, round1(engineLoad), now, TelemetrySource.MOCK),
                new VehicleTelemetryEvent(nodeId, TelemetryMetric.OIL_PRESSURE, round1(oilPressure), now, TelemetrySource.MOCK),
                new VehicleTelemetryEvent(nodeId, TelemetryMetric.BATTERY_VOLTAGE, round1(batteryVoltage), now, TelemetrySource.MOCK)
        );
    }

    private void advanceRpmAndLoad(Map<TelemetryMetric, Double> overrides) {
        if (overrides.containsKey(TelemetryMetric.ENGINE_RPM)) {
            rpm = approach(rpm, overrides.get(TelemetryMetric.ENGINE_RPM), 0.15);
        } else {
            // Gentle idle/cruise wander — same "no instant jumps" wave pattern
            // as the original MockTelemetrySimulator, just centered lower
            // (cruise, not redline sweeps) since this represents a car
            // sitting in a demo room, not a dyno run.
            throttlePhase += (0.02 + ThreadLocalRandom.current().nextDouble(0.0, 0.01)) * speedMultiplier;
            double wave = (Math.sin(throttlePhase) + 1.0) / 2.0;
            double target = IDLE_RPM + wave * (CRUISE_RPM - IDLE_RPM);
            double jitter = ThreadLocalRandom.current().nextDouble(-15, 15);
            rpm = clamp(approach(rpm, target, 0.06 * speedMultiplier) + jitter, IDLE_RPM - 30, CRUISE_RPM + 200);
        }

        if (overrides.containsKey(TelemetryMetric.ENGINE_LOAD)) {
            engineLoad = approach(engineLoad, overrides.get(TelemetryMetric.ENGINE_LOAD), 0.15);
        } else {
            // Load correlates with RPM above idle — same coupling principle
            // as the original simulator, kept for physical plausibility.
            double normalized = clamp((rpm - IDLE_RPM) / (CRUISE_RPM - IDLE_RPM), 0, 1);
            double targetLoad = 10.0 + normalized * 55.0;
            double noise = ThreadLocalRandom.current().nextDouble(-2.0, 2.0);
            engineLoad = clamp(approach(engineLoad, targetLoad, 0.1) + noise, 0, 100);
        }
    }

    private void advanceCoolantTemp(Map<TelemetryMetric, Double> overrides) {
        if (overrides.containsKey(TelemetryMetric.COOLANT_TEMP)) {
            coolantTemp = approach(coolantTemp, overrides.get(TelemetryMetric.COOLANT_TEMP), 0.1);
            return;
        }

        double target = switch (activeScenario) {
            case OVERHEATING, MULTIPLE_FAULTS -> OVERHEAT_TARGET_TEMP_C;
            default -> HEALTHY_OPERATING_TEMP_C;
        };

        // Slow, monotonic-feeling approach (small step rate) so the rise
        // across HEALTHY -> WARNING -> CRITICAL thresholds is visibly
        // gradual on the dashboard/timeline, per the brief's explicit
        // 90 -> 96 -> 102 -> 108 -> 115 progression example.
        double stepRate = coolantTemp < target ? 0.025 : 0.05; // cools faster than it heats, still gradual
        double noise = ThreadLocalRandom.current().nextDouble(-0.08, 0.08);
        coolantTemp = clamp(approach(coolantTemp, target, stepRate * speedMultiplier) + noise, 15.0, 130.0);
    }

    private void advanceOilPressure(Map<TelemetryMetric, Double> overrides) {
        if (overrides.containsKey(TelemetryMetric.OIL_PRESSURE)) {
            oilPressure = approach(oilPressure, overrides.get(TelemetryMetric.OIL_PRESSURE), 0.15);
            return;
        }

        double target = switch (activeScenario) {
            case LOW_OIL_PRESSURE, MULTIPLE_FAULTS -> LOW_OIL_TARGET_PSI;
            default -> HEALTHY_OIL_PSI;
        };

        double noise = ThreadLocalRandom.current().nextDouble(-0.5, 0.5);
        oilPressure = clamp(approach(oilPressure, target, 0.03 * speedMultiplier) + noise, 0, 90);
    }

    private void advanceBatteryVoltage(Map<TelemetryMetric, Double> overrides) {
        if (overrides.containsKey(TelemetryMetric.BATTERY_VOLTAGE)) {
            batteryVoltage = approach(batteryVoltage, overrides.get(TelemetryMetric.BATTERY_VOLTAGE), 0.15);
            return;
        }

        double target = switch (activeScenario) {
            case WEAK_BATTERY, MULTIPLE_FAULTS -> WEAK_BATTERY_TARGET_V;
            default -> HEALTHY_BATTERY_V;
        };

        double noise = ThreadLocalRandom.current().nextDouble(-0.03, 0.03);
        batteryVoltage = clamp(approach(batteryVoltage, target, 0.025 * speedMultiplier) + noise, 9.0, 15.5);
    }

    /** Exponential approach toward a target — the single mechanism behind every "gradual, not instant" change here. */
    private static double approach(double current, double target, double rate) {
        return current + (target - current) * clamp(rate, 0, 1);
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private static double round0(double value) {
        return Math.round(value);
    }
}

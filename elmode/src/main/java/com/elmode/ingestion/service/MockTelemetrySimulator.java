package com.elmode.ingestion.service;

import com.elmode.ingestion.model.TelemetryMetric;
import com.elmode.ingestion.model.VehicleTelemetryEvent;
import com.elmode.ingestion.model.VehicleTelemetryEvent.TelemetrySource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

class MockTelemetrySimulator {

    private static final Logger log = LoggerFactory.getLogger(MockTelemetrySimulator.class);

    private static final double IDLE_RPM = 800.0;
    private static final double REDLINE_RPM = 6500.0;
    private static final double COLD_START_TEMP_C = 18.0;
    private static final double OPERATING_TEMP_C = 90.0;

    private final String nodeId;
    private final long simulationStart = System.currentTimeMillis();

    private double currentRpm = IDLE_RPM;
    private double currentCoolantTemp = COLD_START_TEMP_C;
    private double throttlePhase = 0.0;

    MockTelemetrySimulator(String nodeId) {
        this.nodeId = nodeId;
        log.info("MockTelemetrySimulator initialized for node [{}] — cold start at {}°C", nodeId, COLD_START_TEMP_C);
    }

    List<VehicleTelemetryEvent> nextSample() {
        Instant now = Instant.now();

        advanceRpm();
        advanceCoolantTemp();
        double engineLoad = computeEngineLoad();

        return List.of(
                new VehicleTelemetryEvent(nodeId, TelemetryMetric.ENGINE_RPM, Math.round(currentRpm), now, TelemetrySource.MOCK),
                new VehicleTelemetryEvent(nodeId, TelemetryMetric.COOLANT_TEMP, round1(currentCoolantTemp), now, TelemetrySource.MOCK),
                new VehicleTelemetryEvent(nodeId, TelemetryMetric.ENGINE_LOAD, round1(engineLoad), now, TelemetrySource.MOCK)
        );
    }

    private void advanceRpm() {
        throttlePhase += 0.03 + ThreadLocalRandom.current().nextDouble(0.0, 0.02);
        double throttleWave = (Math.sin(throttlePhase) + 1.0) / 2.0; // normalized 0..1

        double targetRpm = IDLE_RPM + throttleWave * (REDLINE_RPM - IDLE_RPM) * 0.6;
        double jitter = ThreadLocalRandom.current().nextDouble(-40, 40);

        currentRpm += (targetRpm - currentRpm) * 0.08;
        currentRpm = clamp(currentRpm + jitter, IDLE_RPM - 50, REDLINE_RPM);
    }

    private void advanceCoolantTemp() {
        double elapsedSeconds = (System.currentTimeMillis() - simulationStart) / 1000.0;

        if (currentCoolantTemp < OPERATING_TEMP_C) {
            double warmupRate = 0.15 * (OPERATING_TEMP_C - currentCoolantTemp) / 10.0;
            currentCoolantTemp += warmupRate + ThreadLocalRandom.current().nextDouble(-0.05, 0.1);
        } else {
            double loadHeat = (currentRpm > 4000) ? 0.03 : 0.0;
            double drift = ThreadLocalRandom.current().nextDouble(-0.15, 0.15) + loadHeat;
            currentCoolantTemp = clamp(currentCoolantTemp + drift, 85.0, 104.0);
        }

        currentCoolantTemp = clamp(currentCoolantTemp, COLD_START_TEMP_C - 5, 110.0);
    }

    private double computeEngineLoad() {
        double normalized = (currentRpm - IDLE_RPM) / (REDLINE_RPM - IDLE_RPM);
        double baseLoad = clamp(normalized * 85.0, 8.0, 100.0);
        double noise = ThreadLocalRandom.current().nextDouble(-3.0, 3.0);
        return clamp(baseLoad + noise, 0.0, 100.0);
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
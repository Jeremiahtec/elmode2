package com.elmode.ingestion.service;

import com.elmode.ingestion.elm327.Elm327ResponseParser;
import com.elmode.ingestion.model.TelemetryMetric;
import com.elmode.ingestion.model.VehicleTelemetryEvent;
import com.elmode.ingestion.model.VehicleTelemetryEvent.TelemetrySource;
import com.elmode.ingestion.serial.Elm327SerialTransport;
import com.elmode.simulation.service.ScenarioTelemetryGenerator;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

@Service
public class ObdReaderService {

    private static final Logger log = LoggerFactory.getLogger(ObdReaderService.class);

    // --- Configuration ---
    @Value("${obd.port.name}")
    private String portName;
    @Value("${obd.baud.rate}")
    private int baudRate;
    @Value("${obd.data.bits:8}")
    private int dataBits;
    @Value("${obd.stop.bits:1}")
    private int stopBits;
    @Value("${obd.parity:0}")
    private int parity;
    @Value("${obd.read.timeout.ms:2000}")
    private int readTimeoutMs;
    @Value("${obd.write.timeout.ms:1000}")
    private int writeTimeoutMs;

    @Value("${obd.poll.interval.ms:150}")
    private long pollIntervalMs;

    @Value("${obd.reconnect.enabled:true}")
    private boolean reconnectEnabled;
    @Value("${obd.reconnect.initial-backoff.ms:1000}")
    private long initialBackoffMs;
    @Value("${obd.reconnect.max-backoff.ms:30000}")
    private long maxBackoffMs;
    @Value("${obd.reconnect.backoff-multiplier:2.0}")
    private double backoffMultiplier;
    @Value("${obd.reconnect.failure-threshold:5}")
    private int failureThreshold;

    @Value("${obd.mock.enabled:false}")
    private boolean mockEnabled;
    @Value("${obd.mock.node-id:SIM-NODE-01}")
    private String mockNodeId;

    @Value("${obd.vehicle.node-id:VEH-001}")
    private String vehicleNodeId;

    // --- Runtime state ---
    private final List<Consumer<VehicleTelemetryEvent>> listeners = new CopyOnWriteArrayList<>();
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);

    private ExecutorService pollingExecutor;
    private Elm327SerialTransport transport;

    // Replaces the old private MockTelemetrySimulator for the mock path.
    // ScenarioTelemetryGenerator is a strict superset (adds oil pressure/
    // battery voltage + named scenarios + manual override + speed control)
    // needed for the defense demo; MockTelemetrySimulator.java is left
    // in place, untouched, in case you want the simpler generator back later.
    private ScenarioTelemetryGenerator scenarioGenerator;

    // Engine on/off gate for the mock/scenario path — controlled by
    // SimulationController. When false, pollMockCycle() is a no-op (no
    // samples published), matching the real-world expectation that an
    // OBD-II bus goes quiet without ignition power. Hardware path is
    // unaffected; a real ELM327 will simply time out/NODATA on its own
    // if the vehicle is off, which pollHardwareCycle() already handles.
    private final AtomicBoolean engineRunning = new AtomicBoolean(false);

    private static final List<TelemetryMetric> POLLED_METRICS = List.of(
            TelemetryMetric.ENGINE_RPM,
            TelemetryMetric.COOLANT_TEMP,
            TelemetryMetric.ENGINE_LOAD
    );
    public void registerListener(Consumer<VehicleTelemetryEvent> listener) {
        listeners.add(listener);
        log.info("Registered telemetry listener: {}. Total listeners: {}",
                listener.getClass().getSimpleName(), listeners.size());
    }

    @PostConstruct
    public void start() {
        // Java 21 virtual threads: cheap enough that blocking serial I/O here
        // never risks starving the platform thread pool used by Tomcat/Spring MVC.
        pollingExecutor = Executors.newVirtualThreadPerTaskExecutor();
        running.set(true);

        if (mockEnabled) {
            log.warn("=== OBD MOCK MODE ENABLED — no physical hardware will be accessed ===");
            scenarioGenerator = new ScenarioTelemetryGenerator(mockNodeId);
        } else {
            transport = new Elm327SerialTransport(
                    portName, baudRate, dataBits, stopBits, parity, readTimeoutMs, writeTimeoutMs);
        }

        pollingExecutor.submit(this::runPollingLoop);
        log.info("ObdReaderService started. mockEnabled={}, port={}, pollIntervalMs={}",
                mockEnabled, mockEnabled ? "N/A" : portName, pollIntervalMs);
    }

    @PreDestroy
    public void stop() {
        log.info("Shutting down ObdReaderService...");
        running.set(false);
        if (transport != null) {
            transport.close();
        }
        if (pollingExecutor != null) {
            pollingExecutor.shutdownNow();
        }
    }


    private void runPollingLoop() {
        Thread.currentThread().setName("obd-polling-loop");

        if (!mockEnabled) {
            attemptConnectWithRetry();
        }

        while (running.get()) {
            try {
                if (mockEnabled) {
                    pollMockCycle();
                } else {
                    pollHardwareCycle();
                }
                consecutiveFailures.set(0);
            } catch (Exception e) {
                int failures = consecutiveFailures.incrementAndGet();
                log.error("Telemetry poll cycle failed ({}/{} consecutive failures): {}",
                        failures, failureThreshold, e.getMessage());

                if (!mockEnabled && failures >= failureThreshold) {
                    log.warn("Failure threshold reached. Forcing serial reconnect on port [{}]", portName);
                    if (transport != null) {
                        transport.close();
                    }
                    attemptConnectWithRetry();
                    consecutiveFailures.set(0);
                }
            }

            sleepQuietly(pollIntervalMs);
        }

        log.info("Polling loop exited cleanly.");
    }

    private void pollHardwareCycle() throws Exception {
        for (TelemetryMetric metric : POLLED_METRICS) {
            String raw = transport.sendCommand(metric.pid());
            Double value = Elm327ResponseParser.parse(metric, raw);

            if (value == null) {
                log.debug("No valid data parsed for metric [{}] from raw response '{}'", metric, raw);
                continue;
            }

            VehicleTelemetryEvent event = new VehicleTelemetryEvent(
                    vehicleNodeId, metric, value, java.time.Instant.now(), TelemetrySource.HARDWARE);
            publish(event);
        }
    }

    private void pollMockCycle() {
        if (!engineRunning.get()) {
            return; // Ignition off — bus is silent, no samples published.
        }
        for (VehicleTelemetryEvent event : scenarioGenerator.nextSample()) {
            publish(event);
        }
    }

    private void publish(VehicleTelemetryEvent event) {
        for (Consumer<VehicleTelemetryEvent> listener : listeners) {
            try {
                listener.accept(event);
            } catch (Exception e) {
                // A misbehaving downstream consumer must never kill the ingestion loop.
                log.error("Telemetry listener threw an exception processing event [{}]: {}",
                        event, e.getMessage(), e);
            }
        }
    }


    private void attemptConnectWithRetry() {
        long backoff = initialBackoffMs;
        int attempt = 0;

        while (running.get()) {
            attempt++;
            try {
                transport.connect();
                log.info("Serial connection established on attempt #{}", attempt);
                return;
            } catch (Elm327SerialTransport.SerialConnectionException e) {
                log.error("Connection attempt #{} failed: {}. Retrying in {} ms.",
                        attempt, e.getMessage(), backoff);

                if (!reconnectEnabled) {
                    log.error("obd.reconnect.enabled=false — aborting further connection attempts.");
                    return;
                }

                sleepQuietly(backoff);
                backoff = Math.min((long) (backoff * backoffMultiplier), maxBackoffMs);
            }
        }
    }

    private void sleepQuietly(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            running.set(false);
        }
    }

    public boolean isRunning() {
        return running.get();
    }

    public boolean isMockMode() {
        return mockEnabled;
    }

    // ---------- Simulation control surface (used by SimulationController) ----------

    /**
     * Exposes the scenario generator for control purposes. Returns null in
     * hardware mode (mockEnabled=false) — callers (SimulationController)
     * must handle that case, since simulation controls are meaningless
     * against real hardware.
     */
    public ScenarioTelemetryGenerator getScenarioGenerator() {
        return scenarioGenerator;
    }

    public void setEngineRunning(boolean isRunning) {
        boolean changed = engineRunning.compareAndSet(!isRunning, isRunning);
        if (changed) {
            log.info("Engine state changed: {}", isRunning ? "RUNNING" : "OFF");
        }
    }

    public boolean isEngineRunning() {
        return engineRunning.get();
    }
}
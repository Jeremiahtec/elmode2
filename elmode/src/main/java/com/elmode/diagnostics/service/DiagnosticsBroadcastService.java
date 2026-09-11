package com.elmode.diagnostics.service;

import com.elmode.diagnostics.model.VehicleHealthSnapshot;
import com.elmode.telemetry.service.TelemetryStateStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Periodically re-evaluates diagnostic state for every known vehicle node
 * and broadcasts the result over /topic/diagnostics.
 * <p>
 * DELIBERATELY decoupled from the raw telemetry publish rate (see
 * TelemetryWebSocketPublisher, which fires per-sample at ~poll-interval
 * cadence). Diagnostics don't need to re-run on every single RPM tick —
 * a fixed 1-second cadence is plenty responsive for the dashboard/timeline
 * while keeping the diagnostic engine's CPU cost and WebSocket traffic
 * bounded regardless of how fast telemetry itself is arriving.
 * <p>
 * Requires @EnableScheduling — see ElmodeApplication.
 */
@Service
public class DiagnosticsBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(DiagnosticsBroadcastService.class);
    private static final String BROADCAST_DESTINATION = "/topic/diagnostics";

    private final DiagnosticEngine diagnosticEngine;
    private final TelemetryStateStore stateStore;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${obd.vehicle.node-id:VEH-001}")
    private String defaultNodeId;

    public DiagnosticsBroadcastService(DiagnosticEngine diagnosticEngine,
                                        TelemetryStateStore stateStore,
                                        SimpMessagingTemplate messagingTemplate) {
        this.diagnosticEngine = diagnosticEngine;
        this.stateStore = stateStore;
        this.messagingTemplate = messagingTemplate;
    }

    @Scheduled(fixedDelay = 1000)
    public void broadcastDiagnostics() {
        try {
            // Evaluate the default node always (covers the single-vehicle
            // defense demo even before any sample has arrived), plus any
            // other nodes the state store has learned about.
            var nodeIds = new java.util.HashSet<>(stateStore.knownNodeIds());
            nodeIds.add(defaultNodeId);

            for (String nodeId : nodeIds) {
                VehicleHealthSnapshot snapshot = diagnosticEngine.evaluate(nodeId);
                messagingTemplate.convertAndSend(BROADCAST_DESTINATION, snapshot);
            }
        } catch (Exception e) {
            // Never let a diagnostics-broadcast failure take down the
            // scheduled task thread or affect the raw telemetry pipeline.
            log.error("Diagnostics broadcast cycle failed: {}", e.getMessage(), e);
        }
    }
}

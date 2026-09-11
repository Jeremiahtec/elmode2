package com.elmode.telemetry.controller;

import com.elmode.telemetry.model.TelemetryBroadcastMessage;
import com.elmode.telemetry.service.TelemetryStateStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;
import java.util.Set;

@RestController
@CrossOrigin(origins = "${elmode.cors.allowed-origins:http://localhost:3000}")
public class TelemetryController {

    private static final Logger log = LoggerFactory.getLogger(TelemetryController.class);

    private final TelemetryStateStore stateStore;

    @Value("${obd.vehicle.node-id:VEH-001}")
    private String defaultNodeId;

    public TelemetryController(TelemetryStateStore stateStore) {
        this.stateStore = stateStore;
    }


    @GetMapping("/api/telemetry/latest")
    public ResponseEntity<Collection<TelemetryBroadcastMessage>> getLatestSnapshot(
            @RequestParam(required = false) String nodeId) {

        String targetNode = (nodeId != null && !nodeId.isBlank()) ? nodeId : defaultNodeId;
        Collection<TelemetryBroadcastMessage> snapshot = stateStore.snapshotForNode(targetNode);

        log.debug("Snapshot requested for node [{}] — returning {} metric(s)", targetNode, snapshot.size());
        return ResponseEntity.ok(snapshot);
    }

    @GetMapping("/api/telemetry/nodes")
    public ResponseEntity<Set<String>> getKnownNodes() {
        return ResponseEntity.ok(stateStore.knownNodeIds());
    }
}
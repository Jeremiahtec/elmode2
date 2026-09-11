package com.elmode.diagnostics.controller;

import com.elmode.diagnostics.model.VehicleHealthSnapshot;
import com.elmode.diagnostics.service.DiagnosticEngine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST hydration endpoint for diagnostic snapshots — mirrors
 * TelemetryController's pattern for /api/telemetry/latest. Used by the
 * dashboard and component-health panel on initial page load; the live
 * updates thereafter come from /topic/diagnostics (see DiagnosticsBroadcastService).
 */
@RestController
@CrossOrigin(origins = "${elmode.cors.allowed-origins:http://localhost:3000}")
public class DiagnosticsController {

    private final DiagnosticEngine diagnosticEngine;

    @Value("${obd.vehicle.node-id:VEH-001}")
    private String defaultNodeId;

    public DiagnosticsController(DiagnosticEngine diagnosticEngine) {
        this.diagnosticEngine = diagnosticEngine;
    }

    @GetMapping("/api/diagnostics/latest")
    public ResponseEntity<VehicleHealthSnapshot> getLatestDiagnosis(
            @RequestParam(required = false) String nodeId) {
        String targetNode = (nodeId != null && !nodeId.isBlank()) ? nodeId : defaultNodeId;
        return ResponseEntity.ok(diagnosticEngine.evaluate(targetNode));
    }
}

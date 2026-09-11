package com.elmode.telemetry.service;

import com.elmode.ingestion.model.TelemetryMetric;
import com.elmode.telemetry.model.TelemetryBroadcastMessage;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TelemetryStateStore {

    private final Map<String, Map<TelemetryMetric, TelemetryBroadcastMessage>> latestByNode =
            new ConcurrentHashMap<>();

    public void update(TelemetryBroadcastMessage message) {
        latestByNode
                .computeIfAbsent(message.nodeId(), id -> new ConcurrentHashMap<>())
                .put(message.metric(), message);
    }

    public Collection<TelemetryBroadcastMessage> snapshotForNode(String nodeId) {
        Map<TelemetryMetric, TelemetryBroadcastMessage> nodeState = latestByNode.get(nodeId);
        return nodeState == null ? java.util.List.of() : java.util.List.copyOf(nodeState.values());
    }

    public Set<String> knownNodeIds() {
        return Set.copyOf(latestByNode.keySet());
    }

    public TelemetryBroadcastMessage getLatest(String nodeId, TelemetryMetric metric) {
        Map<TelemetryMetric, TelemetryBroadcastMessage> nodeState = latestByNode.get(nodeId);
        return nodeState == null ? null : nodeState.get(metric);
    }
}
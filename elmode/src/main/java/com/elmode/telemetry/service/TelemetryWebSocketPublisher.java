package com.elmode.telemetry.service;

import com.elmode.ingestion.model.VehicleTelemetryEvent;
import com.elmode.ingestion.service.ObdReaderService;
import com.elmode.telemetry.model.DegradationStatus;
import com.elmode.telemetry.model.TelemetryBroadcastMessage;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class TelemetryWebSocketPublisher {

    private static final Logger log = LoggerFactory.getLogger(TelemetryWebSocketPublisher.class);
    private static final String BROADCAST_DESTINATION = "/topic/telemetry";

    private final ObdReaderService obdReaderService;
    private final SimpMessagingTemplate messagingTemplate;
    private final DegradationEvaluator degradationEvaluator;
    private final TelemetryStateStore stateStore;

    private long messagesPublished = 0;
    private long lastLogTimestamp = System.currentTimeMillis();
    private static final long LOG_INTERVAL_MS = 30_000;

    public TelemetryWebSocketPublisher(ObdReaderService obdReaderService,
                                       SimpMessagingTemplate messagingTemplate,
                                       DegradationEvaluator degradationEvaluator,
                                       TelemetryStateStore stateStore) {
        this.obdReaderService = obdReaderService;
        this.messagingTemplate = messagingTemplate;
        this.degradationEvaluator = degradationEvaluator;
        this.stateStore = stateStore;
    }

    @PostConstruct
    public void init() {
        obdReaderService.registerListener(this::onTelemetryEvent);
        log.info("TelemetryWebSocketPublisher wired into ObdReaderService. Broadcasting to [{}]", BROADCAST_DESTINATION);
    }

    private void onTelemetryEvent(VehicleTelemetryEvent event) {
        try {
            DegradationStatus status = degradationEvaluator.evaluate(event);
            TelemetryBroadcastMessage message = TelemetryBroadcastMessage.from(event, status);

            stateStore.update(message);
            messagingTemplate.convertAndSend(BROADCAST_DESTINATION, message);

            messagesPublished++;
            logThroughputPeriodically();

            if (status != DegradationStatus.INFO) {
                log.warn("Degradation status [{}] for node [{}] metric [{}] = {} {}",
                        status, event.nodeId(), event.metric(), event.value(), event.metric().unit());
            }
        } catch (Exception e) {
            log.error("Failed to broadcast telemetry event [{}]: {}", event, e.getMessage(), e);
        }
    }

    private void logThroughputPeriodically() {
        long now = System.currentTimeMillis();
        if (now - lastLogTimestamp >= LOG_INTERVAL_MS) {
            log.info("Telemetry broadcast throughput: {} messages published in last {}s",
                    messagesPublished, LOG_INTERVAL_MS / 1000);
            messagesPublished = 0;
            lastLogTimestamp = now;
        }
    }
}
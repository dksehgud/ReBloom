package com.ssafy.rebloom.biometric_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.rebloom.biometric_service.service.AnomalyService;
import com.ssafy.rebloom.event.core.EventEnvelope;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.AnomalyEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnomalyAnalysedEventConsumer {

    private final ObjectMapper objectMapper;
    private final AnomalyService anomalyService;

    @KafkaListener(
        topics = "${rebloom.kafka.topics.anomaly-analysed}",
        groupId = "${rebloom.kafka.consumer.group-id}",
        containerFactory = "rebloomKafkaListenerContainerFactory"
    )
    public void consume(@Payload EventEnvelope<?> envelope) {
        try {
            MDC.put("correlationId", envelope.correlationId());

            if (!EventTypes.ANOMALY_ANALYSED.equals(envelope.eventType())) {
                log.warn("Unexpected eventType. eventType={}, eventId={}", envelope.eventType(), envelope.eventId());
                return;
            }

            AnomalyEvent payload = objectMapper.convertValue(
                envelope.payload(),
                AnomalyEvent.class
            );

            anomalyService.save(payload, envelope.correlationId());
        } finally {
            MDC.remove("correlationId");
        }
    }
}
package com.ssafy.rebloom.report_service.analysis.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.rebloom.event.core.EventEnvelope;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.DailyStatusCardCreatedEvent;
import com.ssafy.rebloom.report_service.analysis.service.StatusCardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StatusCardConsumer {

    private final ObjectMapper objectMapper;
    private final StatusCardService statusCardService;

    @KafkaListener(
        topics = "${rebloom.kafka.topics.status-card-created}",
        groupId = "${rebloom.kafka.consumer.group-id}",
        containerFactory = "rebloomKafkaListenerContainerFactory"
    )
    public void consume(@Payload EventEnvelope<?> envelope) {
        try {
            MDC.put("correlationId", envelope.correlationId());

            if (!EventTypes.STATUS_CARD_CREATED.equals(envelope.eventType())) {
                log.warn(
                    "Unexpected eventType. eventType={}, eventId={}",
                    envelope.eventType(),
                    envelope.eventId()
                );
                return;
            }

            DailyStatusCardCreatedEvent payload = objectMapper.convertValue(
                envelope.payload(),
                DailyStatusCardCreatedEvent.class
            );

            statusCardService.save(payload);

            log.info(
                "Status card saved. userId={}, date={}, eventId={}",
                payload.userId(),
                payload.date(),
                envelope.eventId()
            );
        } finally {
            MDC.remove("correlationId");
        }
    }
}
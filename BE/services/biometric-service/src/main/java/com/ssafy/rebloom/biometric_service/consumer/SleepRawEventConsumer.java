package com.ssafy.rebloom.biometric_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.rebloom.biometric_service.service.SleepEventService;
import com.ssafy.rebloom.event.core.EventEnvelope;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.SleepDataEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SleepRawEventConsumer {

    private final ObjectMapper objectMapper;
    private final SleepEventService sleepEventService;

    @KafkaListener(
        topics = "${rebloom.kafka.topics.sleep-raw}",
        groupId = "${rebloom.kafka.consumer.group-id}",
        containerFactory = "rebloomKafkaListenerContainerFactory"
    )
    public void consume(@Payload EventEnvelope<?> envelope) {
        try {
            MDC.put("correlationId", envelope.correlationId());

            if (!EventTypes.SLEEP_DATA_RECEIVED.equals(envelope.eventType())) {
                log.warn("Unexpected eventType. eventType={}, eventId={}", envelope.eventType(), envelope.eventId());
                return;
            }

            SleepDataEvent payload = objectMapper.convertValue(
                envelope.payload(),
                SleepDataEvent.class
            );

            sleepEventService.saveSleepRawEvent(payload, envelope.correlationId());
        } finally {
            MDC.remove("correlationId");
        }
    }
}
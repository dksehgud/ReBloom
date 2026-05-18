package com.ssafy.rebloom.biometric_service.consumer;

import com.ssafy.rebloom.biometric_service.service.PhqResultService;
import com.ssafy.rebloom.event.core.EventEnvelope;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.PhqResultEvent;
import com.ssafy.rebloom.event.support.KafkaPayloadMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PhqResultEventConsumer {

    private final KafkaPayloadMapper kafkaPayloadMapper;
    private final PhqResultService phqResultService;

    @KafkaListener(
        topics = "${rebloom.kafka.topics.phq-completed}",
        groupId = "${rebloom.kafka.consumer.group-id}",
        containerFactory = "rebloomKafkaListenerContainerFactory"
    )
    public void consume(@Payload EventEnvelope<?> envelope) {
        try {
            MDC.put("correlationId", envelope.correlationId());

            if (!EventTypes.PHQ_COMPLETED.equals(envelope.eventType())) {
                log.warn("Unexpected eventType. eventType={}, eventId={}", envelope.eventType(), envelope.eventId());
                return;
            }

            PhqResultEvent payload = kafkaPayloadMapper.convertValue(
                envelope.payload(),
                PhqResultEvent.class
            );

            phqResultService.save(payload, envelope.correlationId());
        } finally {
            MDC.remove("correlationId");
        }
    }
}
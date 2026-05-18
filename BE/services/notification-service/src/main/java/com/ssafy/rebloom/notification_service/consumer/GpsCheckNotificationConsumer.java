package com.ssafy.rebloom.notification_service.consumer;

import com.ssafy.rebloom.event.core.EventEnvelope;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.GpsCheckResultEvent;
import com.ssafy.rebloom.event.support.KafkaPayloadMapper;
import com.ssafy.rebloom.notification_service.service.GpsCheckNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class GpsCheckNotificationConsumer {

    private final KafkaPayloadMapper kafkaPayloadMapper;
    private final GpsCheckNotificationService gpsCheckNotificationService;

    @KafkaListener(
        topics = "${rebloom.kafka.topics.gps-check-same}",
        groupId = "${rebloom.kafka.consumer.group-id}",
        containerFactory = "rebloomKafkaListenerContainerFactory"
    )
    public void consumeGpsCheckSame(@Payload EventEnvelope<?> envelope) {
        try {
            MDC.put("correlationId", envelope.correlationId());

            if (!EventTypes.GPS_CHECK_SAME.equals(envelope.eventType())) {
                log.warn(
                    "Unexpected eventType. eventType={}, eventId={}",
                    envelope.eventType(),
                    envelope.eventId()
                );
                return;
            }

            GpsCheckResultEvent payload = kafkaPayloadMapper.convertValue(
                envelope.payload(),
                GpsCheckResultEvent.class
            );

            gpsCheckNotificationService.handleGpsCheckSame(
                payload,
                envelope.eventId(),
                envelope.correlationId(),
                envelope.idempotencyKey()
            );
        }catch (RuntimeException e) {
            log.error(
                "GPS same event consume failed. eventId={}, correlationId={}, idempotencyKey={}, payload={}",
                envelope.eventId(),
                envelope.correlationId(),
                envelope.idempotencyKey(),
                envelope.payload(),
                e
            );
            throw e;
        } finally {
            MDC.remove("correlationId");
        }
    }

    @KafkaListener(
        topics = "${rebloom.kafka.topics.gps-check-different}",
        groupId = "${rebloom.kafka.consumer.group-id}",
        containerFactory = "rebloomKafkaListenerContainerFactory"
    )
    public void consumeGpsCheckDifferent(@Payload EventEnvelope<?> envelope) {
        try {
            MDC.put("correlationId", envelope.correlationId());

            if (!EventTypes.GPS_CHECK_DIFFERENT.equals(envelope.eventType())) {
                log.warn(
                    "Unexpected eventType. eventType={}, eventId={}",
                    envelope.eventType(),
                    envelope.eventId()
                );
                return;
            }

            GpsCheckResultEvent payload = kafkaPayloadMapper.convertValue(
                envelope.payload(),
                GpsCheckResultEvent.class
            );

            gpsCheckNotificationService.handleGpsCheckDifferent(
                payload,
                envelope.eventId(),
                envelope.correlationId(),
                envelope.idempotencyKey()
            );
        }catch (RuntimeException e) {
            log.error(
                "GPS different event consume failed. eventId={}, correlationId={}, idempotencyKey={}, payload={}",
                envelope.eventId(),
                envelope.correlationId(),
                envelope.idempotencyKey(),
                envelope.payload(),
                e
            );
            throw e;
        } finally {
            MDC.remove("correlationId");
        }
    }
}
package com.ssafy.rebloom.notification_service.consumer;

import com.ssafy.rebloom.event.core.EventEnvelope;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.ParentReportCommentCreatedEvent;
import com.ssafy.rebloom.event.dto.ParentReportCreatedEvent;
import com.ssafy.rebloom.event.support.KafkaPayloadMapper;
import com.ssafy.rebloom.notification_service.service.ParentReportNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ParentReportNotificationConsumer {

    private final KafkaPayloadMapper kafkaPayloadMapper;
    private final ParentReportNotificationService parentReportNotificationService;

    @KafkaListener(
        topics = "${rebloom.kafka.topics.parent-report-created}",
        groupId = "${rebloom.kafka.consumer.group-id}",
        containerFactory = "rebloomKafkaListenerContainerFactory"
    )
    public void consumeParentReportCreated(@Payload EventEnvelope<?> envelope) {
        try {
            MDC.put("correlationId", envelope.correlationId());

            if (!EventTypes.PARENT_REPORT_CREATED.equals(envelope.eventType())) {
                log.warn(
                    "Unexpected eventType. eventType={}, eventId={}",
                    envelope.eventType(),
                    envelope.eventId()
                );
                return;
            }

            ParentReportCreatedEvent payload = kafkaPayloadMapper.convertValue(
                envelope.payload(),
                ParentReportCreatedEvent.class
            );

            parentReportNotificationService.handleParentReportCreated(
                payload,
                envelope.eventId(),
                envelope.idempotencyKey()
            );
        } finally {
            MDC.remove("correlationId");
        }
    }

    @KafkaListener(
        topics = "${rebloom.kafka.topics.parent-report-comment-created}",
        groupId = "${rebloom.kafka.consumer.group-id}",
        containerFactory = "rebloomKafkaListenerContainerFactory"
    )
    public void consumeParentReportCommentCreated(@Payload EventEnvelope<?> envelope) {
        try {
            MDC.put("correlationId", envelope.correlationId());

            if (!EventTypes.PARENT_REPORT_COMMENT_CREATED.equals(envelope.eventType())) {
                log.warn(
                    "Unexpected eventType. eventType={}, eventId={}",
                    envelope.eventType(),
                    envelope.eventId()
                );
                return;
            }

            ParentReportCommentCreatedEvent payload = kafkaPayloadMapper.convertValue(
                envelope.payload(),
                ParentReportCommentCreatedEvent.class
            );

            parentReportNotificationService.handleParentReportCommentCreated(
                payload,
                envelope.eventId(),
                envelope.idempotencyKey()
            );
        } finally {
            MDC.remove("correlationId");
        }
    }
}
package com.ssafy.rebloom.report_service.report.event;

import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.ParentReportCommentCreatedEvent;
import com.ssafy.rebloom.event.dto.ParentReportCreatedEvent;
import com.ssafy.rebloom.event.publisher.EventPublisher;
import com.ssafy.rebloom.event.support.EventKeyGenerator;
import com.ssafy.rebloom.report_service.analysis.dto.request.ParentReportCreatedLocalEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ReportNotificationEventPublisher {

    private final EventPublisher eventPublisher;
    private final KafkaCommonProperties kafkaProperties;
    private final EventKeyGenerator eventKeyGenerator;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishParentReportCreated(ParentReportCreatedLocalEvent localEvent) {
        ParentReportCreatedEvent payload = new ParentReportCreatedEvent(
            localEvent.reportId(),
            localEvent.childrenId(),
            localEvent.parentId(),
            localEvent.reportDate(),
            localEvent.createdAt()
        );

        String key = localEvent.parentId().toString();
        String idempotencyKey = eventKeyGenerator.idempotencyKey(
            EventTypes.PARENT_REPORT_CREATED,
            localEvent.parentId().toString(),
            localEvent.reportId().toString()
        );

        eventPublisher.publish(
            kafkaProperties.getTopics().getParentReportCreated(),
            key,
            EventTypes.PARENT_REPORT_CREATED,
            null,
            idempotencyKey,
            payload
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishParentReportCommentCreated(ParentReportCommentCreatedLocalEvent localEvent) {
        ParentReportCommentCreatedEvent payload = new ParentReportCommentCreatedEvent(
            localEvent.commentId(),
            localEvent.reportId(),
            localEvent.childrenId(),
            localEvent.parentId(),
            localEvent.counselorId(),
            localEvent.createdAt()
        );

        String key = localEvent.counselorId().toString();
        String idempotencyKey = eventKeyGenerator.idempotencyKey(
            EventTypes.PARENT_REPORT_COMMENT_CREATED,
            localEvent.counselorId().toString(),
            localEvent.reportId().toString()
        );

        eventPublisher.publish(
            kafkaProperties.getTopics().getParentReportCommentCreated(),
            key,
            EventTypes.PARENT_REPORT_COMMENT_CREATED,
            null,
            idempotencyKey,
            payload
        );
    }
}

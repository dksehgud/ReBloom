package com.ssafy.rebloom.report_service.report.event;

import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.ParentReportCommentCreatedEvent;
import com.ssafy.rebloom.event.dto.ParentReportCreatedEvent;
import com.ssafy.rebloom.event.publisher.EventPublisher;
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

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishParentReportCreated(ParentReportCreatedLocalEvent event) {
        ParentReportCreatedEvent payload = new ParentReportCreatedEvent(
            event.reportId(),
            event.childrenId(),
            event.parentId(),
            event.reportDate(),
            event.createdAt()
        );

        eventPublisher.publish(
            kafkaProperties.getTopics().getParentReportCreated(),
            event.childrenId().toString(),
            EventTypes.PARENT_REPORT_CREATED,
            idempotencyKey("parent-report-created", event.reportId()),
            payload
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishParentReportCommentCreated(ParentReportCommentCreatedEvent event) {
        ParentReportCommentCreatedEvent payload = new ParentReportCommentCreatedEvent(
            event.commentId(),
            event.reportId(),
            event.childrenId(),
            event.parentId(),
            event.counselorId(),
            event.createdAt()
        );

        eventPublisher.publish(
            kafkaProperties.getTopics().getParentReportCommentCreated(),
            event.childrenId().toString(),
            EventTypes.PARENT_REPORT_COMMENT_CREATED,
            idempotencyKey("parent-report-comment-created", event.commentId()),
            payload
        );
    }

    private String idempotencyKey(String eventName, Object id) {
        return eventName + ":" + id;
    }
}
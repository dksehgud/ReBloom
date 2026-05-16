package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.event.dto.ParentReportCommentCreatedEvent;
import com.ssafy.rebloom.event.dto.ParentReportCreatedEvent;

public interface ParentReportNotificationService {

    void handleParentReportCreated(
        ParentReportCreatedEvent event,
        String eventId,
        String idempotencyKey
    );

    void handleParentReportCommentCreated(
        ParentReportCommentCreatedEvent event,
        String eventId,
        String idempotencyKey
    );
}
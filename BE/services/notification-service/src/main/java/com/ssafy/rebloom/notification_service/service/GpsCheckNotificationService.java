package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.event.dto.GpsCheckResultEvent;

public interface GpsCheckNotificationService {

    void handleGpsCheckSame(
        GpsCheckResultEvent event,
        String eventId,
        String correlationId,
        String idempotencyKey
    );

    void handleGpsCheckDifferent(
        GpsCheckResultEvent event,
        String eventId,
        String correlationId,
        String idempotencyKey
    );
}
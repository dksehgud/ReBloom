package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.event.dto.AnomalyEvent;

public interface NotificationService {
    void handleAnomalyAnalysed(AnomalyEvent event, String correlationId);
}

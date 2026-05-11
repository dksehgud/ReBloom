package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.event.dto.AnomalyEvent;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;

public interface NotificationService {
    void handleAnomalyAnalysed(AnomalyEvent event, String correlationId);

    void send(NotificationCommand command);
}

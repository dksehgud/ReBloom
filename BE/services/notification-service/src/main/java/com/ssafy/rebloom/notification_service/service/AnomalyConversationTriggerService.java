package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.event.dto.AnomalyEvent;

public interface AnomalyConversationTriggerService {
    void handleAnomaly(AnomalyEvent event, String correlationId);
}

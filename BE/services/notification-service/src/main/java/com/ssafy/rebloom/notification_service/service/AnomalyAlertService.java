package com.ssafy.rebloom.notification_service.service;

import java.util.UUID;

public interface AnomalyAlertService {
    void handleValidAnomaly(UUID childrenId, UUID parentId, String correlationId);

    void releaseConversationLock(UUID childrenId);

}

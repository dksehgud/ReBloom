package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import java.util.UUID;

public interface AnomalyAlertService {
    void startPhase(ParentReceiverInfo receiverInfo, String correlationId);

    void processDuePhases();

    void confirmPhase(UUID parentId, UUID childrenId, Long notificationId);

    void rejectPhase(UUID parentId, UUID childrenId, Long notificationId, String correlationId);

    boolean requestGpsCheck(UUID childrenId, UUID parentId, String correlationId);

    void releaseConversationLock(UUID childrenId);
}

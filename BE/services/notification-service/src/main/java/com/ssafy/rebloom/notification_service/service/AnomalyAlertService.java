package com.ssafy.rebloom.notification_service.service;

import java.util.UUID;

public interface AnomalyAlertService {
    void handleValidAnomaly(UUID childrenId, String correlationId);

}

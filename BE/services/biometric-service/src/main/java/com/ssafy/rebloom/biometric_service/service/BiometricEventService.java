package com.ssafy.rebloom.biometric_service.service;

import com.ssafy.rebloom.event.dto.BiometricDataEvent;
import java.time.LocalDateTime;
import java.util.UUID;

public interface BiometricEventService {
    void saveBiometric(BiometricDataEvent event, String correlationId);

    void publishAITrainingRequestedEvent(UUID userId, LocalDateTime currentMeasuredAt, String correlationId);
}

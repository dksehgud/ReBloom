package com.ssafy.rebloom.event.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AiModelTrainRequestedEvent(
    UUID userId,
    String modelType,
    String reason,
    Long requiredCount,
    LocalDateTime requestedAt,
    List<BiometricDataEvent> biometrics
) {

}

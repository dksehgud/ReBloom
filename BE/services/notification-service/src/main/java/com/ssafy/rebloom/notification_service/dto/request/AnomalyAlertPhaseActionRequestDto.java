package com.ssafy.rebloom.notification_service.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AnomalyAlertPhaseActionRequestDto(
    @NotNull
    UUID childrenId,
    Long notificationId
) {
}
package com.ssafy.rebloom.notification_service.dto.request;

import jakarta.validation.constraints.NotBlank;

public record FcmTokenDeactivateRequestDto(
    @NotBlank(message = "FCM token is required.")
    String fcmToken
) {
}

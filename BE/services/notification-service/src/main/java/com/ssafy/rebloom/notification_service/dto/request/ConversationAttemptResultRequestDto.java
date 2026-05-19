package com.ssafy.rebloom.notification_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConversationAttemptResultRequestDto(
    @NotNull
    Boolean conversationStarted,

    @NotBlank
    String serialNumber
) {
}
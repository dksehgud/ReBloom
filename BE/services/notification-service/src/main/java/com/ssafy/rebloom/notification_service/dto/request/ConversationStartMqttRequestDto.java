package com.ssafy.rebloom.notification_service.dto.request;

public record ConversationStartMqttRequestDto(
    String type,
    String deviceId,
    String greeting,
    String requestId,
    String createdAt
) {
}
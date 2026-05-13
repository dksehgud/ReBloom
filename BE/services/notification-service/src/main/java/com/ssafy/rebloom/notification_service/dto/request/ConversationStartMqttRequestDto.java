package com.ssafy.rebloom.notification_service.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ConversationStartMqttRequestDto(
    String type,
    @JsonProperty("device_id") String deviceId,
    String greeting,
    @JsonProperty("request_id") String requestId,
    @JsonProperty("created_at") String createdAt
) {
}
package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.response.ChildIotDeviceResponseDto;

public interface ConversationMqttPublishService {
    void publishConversationStart(
        ChildIotDeviceResponseDto device,
        String correlationId
    );
}

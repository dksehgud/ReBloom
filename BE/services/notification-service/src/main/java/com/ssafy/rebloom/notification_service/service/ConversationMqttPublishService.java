package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;

public interface ConversationMqttPublishService {
    void publishConversationStart(
        ChildrenIotInfoResponseDto device,
        String correlationId
    );
}

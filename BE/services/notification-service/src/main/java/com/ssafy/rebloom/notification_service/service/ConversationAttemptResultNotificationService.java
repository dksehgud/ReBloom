package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.request.ConversationAttemptResultRequestDto;

public interface ConversationAttemptResultNotificationService {
    void handleConversationAttemptResult(ConversationAttemptResultRequestDto request);
}

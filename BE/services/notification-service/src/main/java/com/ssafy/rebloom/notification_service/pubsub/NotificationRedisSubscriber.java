package com.ssafy.rebloom.notification_service.pubsub;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.rebloom.notification_service.dto.RealtimeNotificationMessage;
import com.ssafy.rebloom.notification_service.service.NotificationSseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationRedisSubscriber {
    private final ObjectMapper objectMapper;
    private final NotificationSseService notificationSseService;

    public void onMessage(String message) {
        try {
            RealtimeNotificationMessage notificationMessage =
                objectMapper.readValue(message, RealtimeNotificationMessage.class);

            notificationSseService.send(notificationMessage);
        } catch (Exception e) {
            log.warn("Failed to handle redis notification message", e);
        }
    }
}

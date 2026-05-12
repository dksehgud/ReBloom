package com.ssafy.rebloom.notification_service.dto;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import java.time.LocalDateTime;
import java.util.UUID;

public record RealtimeNotificationMessage(
    Long notificationId,
    UUID receiverId,
    ReceiverRole receiverRole,
    NotificationCode notificationType,
    NotificationPayload payload,
    Boolean isRead,
    LocalDateTime createdAt
) {
}
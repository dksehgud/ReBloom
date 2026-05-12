package com.ssafy.rebloom.notification_service.dto.response;

import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import java.time.LocalDateTime;

public record NotificationResponseDto (
    Long id,
    String notificationType,
    NotificationPayload payload,
    boolean isRead,
    String deliveryStatus,
    LocalDateTime createdAt
) {

public static NotificationResponseDto from(Notification notification) {
    return new NotificationResponseDto(
        notification.getId(),
        notification.getNotificationType().getName(),
        notification.getNotificationPayload(),
        notification.isRead(),
        notification.getDeliveryStatus().name(),
        notification.getCreatedAt()
    );
}
}
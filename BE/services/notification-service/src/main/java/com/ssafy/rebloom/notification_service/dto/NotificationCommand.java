package com.ssafy.rebloom.notification_service.dto;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import java.util.UUID;

public record NotificationCommand(
    UUID receiverId,
    ReceiverRole receiverRole,
    NotificationCode notificationCode,
    NotificationPayload payload
) {
}
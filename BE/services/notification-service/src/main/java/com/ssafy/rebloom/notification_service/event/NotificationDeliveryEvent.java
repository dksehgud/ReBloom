package com.ssafy.rebloom.notification_service.event;

import com.ssafy.rebloom.notification_service.dto.RealtimeNotificationMessage;

public record NotificationDeliveryEvent (
    Long notificationId,
    RealtimeNotificationMessage realtimeMessage,
    DeliveryChannel deliveryChannel
) {

public static NotificationDeliveryEvent fcm(Long notificationId) {
    return new NotificationDeliveryEvent(
        notificationId,
        null,
        DeliveryChannel.FCM
    );
}

public static NotificationDeliveryEvent realtime(
    RealtimeNotificationMessage realtimeMessage
) {
    return new NotificationDeliveryEvent(
        realtimeMessage.notificationId(),
        realtimeMessage,
        DeliveryChannel.REALTIME
    );
}

public enum DeliveryChannel {
    FCM,
    REALTIME
}
}
package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.RealtimeNotificationMessage;

public interface NotificationDeliveryService {
    void deliverFcm(Long notificationId);

    void deliverRealtime(RealtimeNotificationMessage message);
}

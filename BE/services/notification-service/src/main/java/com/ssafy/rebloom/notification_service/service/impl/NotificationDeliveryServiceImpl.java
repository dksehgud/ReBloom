package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.dto.RealtimeNotificationMessage;
import com.ssafy.rebloom.notification_service.pubsub.NotificationRedisPublisher;
import com.ssafy.rebloom.notification_service.repository.NotificationRepository;
import com.ssafy.rebloom.notification_service.service.FcmService;
import com.ssafy.rebloom.notification_service.service.NotificationDeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDeliveryServiceImpl implements NotificationDeliveryService {

    private final NotificationRepository notificationRepository;
    private final NotificationRedisPublisher notificationRedisPublisher;
    private final FcmService fcmService;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deliverFcm(Long notificationId) {
        Notification notification = getNotification(notificationId);

        boolean sent = fcmService.send(notification);
        if (sent) {
            notification.markSent();
            return;
        }

        notification.markFailed();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deliverRealtime(RealtimeNotificationMessage message) {
        Notification notification = getNotification(message.notificationId());

        try {
            notificationRedisPublisher.publish(message);
            notification.markSent();
        } catch (RuntimeException e) {
            notification.markFailed();

            log.error(
                "Failed to publish realtime notification. notificationId={}, receiverId={}",
                message.notificationId(),
                message.receiverId(),
                e
            );
        }
    }

    private Notification getNotification(Long notificationId) {
        return notificationRepository.findById(notificationId)
            .orElseThrow(() -> new CustomException(
                "알림을 찾을 수 없습니다.",
                ErrorCode.NOTIFICATION_NOT_FOUND
            ));
    }
}
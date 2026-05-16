package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationType;
import com.ssafy.rebloom.notification_service.domain.enums.DeliveryStatus;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.RealtimeNotificationMessage;
import com.ssafy.rebloom.notification_service.event.NotificationDeliveryEvent;
import com.ssafy.rebloom.notification_service.repository.NotificationRepository;
import com.ssafy.rebloom.notification_service.service.NotificationAlertSender;
import com.ssafy.rebloom.notification_service.service.NotificationSettingService;
import com.ssafy.rebloom.notification_service.service.NotificationTypeService;
import com.ssafy.rebloom.notification_service.service.OnlineStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationAlertSenderImpl implements NotificationAlertSender {

    private final NotificationRepository notificationRepository;
    private final NotificationTypeService notificationTypeService;
    private final NotificationSettingService notificationSettingService;
    private final OnlineStatusService onlineStatusService;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Override
    @Transactional
    public void send(NotificationCommand command) {
        NotificationType notificationType =
            notificationTypeService.resolve(command.notificationCode());

        Notification notification = notificationRepository.save(
            Notification.builder()
                .receiverId(command.receiverId())
                .notificationType(notificationType)
                .notificationPayload(command.payload())
                .deliveryStatus(DeliveryStatus.PENDING)
                .isRead(false)
                .build()
        );

        if (!notificationSettingService.isEnabled(command.receiverId())) {
            return;
        }

        deliver(notification, command);
    }

    private void deliver(Notification notification, NotificationCommand command) {
        if (command.receiverRole() == ReceiverRole.COUNSELOR) {
            publishDeliveryEventForRealtime(notification, command);
            return;
        }

        if (command.receiverRole() == ReceiverRole.PARENT
            || command.receiverRole() == ReceiverRole.CHILDREN) {
            if (onlineStatusService.isOnline(command.receiverId())) {
                publishDeliveryEventForRealtime(notification, command);
            } else {
                publishDeliveryEventForFcm(notification.getId());
            }
        }
    }

    private void publishDeliveryEventForRealtime(
        Notification notification,
        NotificationCommand command
    ) {
        applicationEventPublisher.publishEvent(
            NotificationDeliveryEvent.realtime(
                new RealtimeNotificationMessage(
                    notification.getId(),
                    notification.getReceiverId(),
                    command.receiverRole(),
                    command.notificationCode(),
                    notification.getNotificationPayload(),
                    notification.isRead(),
                    notification.getCreatedAt()
                )
            )
        );
    }

    private void publishDeliveryEventForFcm(Long notificationId) {
        applicationEventPublisher.publishEvent(
            NotificationDeliveryEvent.fcm(notificationId)
        );
    }
}
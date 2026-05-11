package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.event.dto.AnomalyEvent;
import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationType;
import com.ssafy.rebloom.notification_service.domain.enums.DeliveryStatus;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.RealtimeNotificationMessage;
import com.ssafy.rebloom.notification_service.repository.NotificationRepository;
import com.ssafy.rebloom.notification_service.resolver.NotificationTypeResolver;
import com.ssafy.rebloom.notification_service.resolver.ReceiverResolver;
import com.ssafy.rebloom.notification_service.service.FcmService;
import com.ssafy.rebloom.notification_service.service.NotificationRealtimeService;
import com.ssafy.rebloom.notification_service.service.NotificationService;
import com.ssafy.rebloom.notification_service.service.NotificationSettingService;
import com.ssafy.rebloom.notification_service.service.OnlineStatusService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationTypeResolver notificationTypeResolver;
    private final NotificationSettingService notificationSettingService;
    private final OnlineStatusService onlineStatusService;
    private final NotificationRealtimeService notificationRealtimeService;
    private final FcmService fcmService;
    private final ReceiverResolver receiverResolver;

    @Override
    @Transactional
    public void handleAnomalyAnalysed(AnomalyEvent event, String correlationId) {
        if (!Boolean.TRUE.equals(event.isAnomaly())) {
            return;
        }

        UUID childrenId = event.userId();
        ParentReceiverInfo receiverInfo = receiverResolver.resolveParentByChildrenId(childrenId);

        NotificationPayload payload = NotificationPayload.builder()
            .title("주의 필요")
            .content(String.format("지금 한번 %s에게 관심을 표현해볼까요?", receiverInfo.childrenName()))
            .childrenId(receiverInfo.childrenId())
            .childrenName(receiverInfo.childrenName())
            .childrenReportId(null)
            .parentId(receiverInfo.parentId())
            .counselorId(null)
            .counselorName(null)
            .build();

        send(new NotificationCommand(
            receiverInfo.parentId(),
            ReceiverRole.PARENT,
            NotificationCode.RISK_ALERT,
            payload
        ));
    }

    @Override
    @Transactional
    public void send(NotificationCommand command) {
        NotificationType notificationType =
            notificationTypeResolver.resolve(command.notificationCode());

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
            publishRealtime(notification, command);
            return;
        }

        if (command.receiverRole() == ReceiverRole.PARENT) {
            if (onlineStatusService.isOnline(command.receiverId())) {
                publishRealtime(notification, command);
            } else {
                fcmService.send(notification);
            }
        }
    }

    private void publishRealtime(Notification notification, NotificationCommand command) {
        notificationRealtimeService.publish(new RealtimeNotificationMessage(
            notification.getId(),
            notification.getReceiverId(),
            command.receiverRole(),
            command.notificationCode(),
            notification.getNotificationPayload(),
            notification.isRead(),
            notification.getCreatedAt()
        ));
    }
}
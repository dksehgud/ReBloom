package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.common.dto.SliceResponseDto;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.event.dto.AnomalyEvent;
import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationType;
import com.ssafy.rebloom.notification_service.domain.enums.DeliveryStatus;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.RealtimeNotificationMessage;
import com.ssafy.rebloom.notification_service.dto.response.NotificationResponseDto;
import com.ssafy.rebloom.notification_service.event.NotificationDeliveryEvent;
import com.ssafy.rebloom.notification_service.repository.NotificationRepository;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertService;
import com.ssafy.rebloom.notification_service.service.AuthServiceResolveService;
import com.ssafy.rebloom.notification_service.service.NotificationService;
import com.ssafy.rebloom.notification_service.service.NotificationSettingService;
import com.ssafy.rebloom.notification_service.service.NotificationTypeService;
import com.ssafy.rebloom.notification_service.service.OnlineStatusService;
import com.ssafy.rebloom.notification_service.service.RedisService;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationTypeService notificationTypeService;
    private final NotificationSettingService notificationSettingService;
    private final OnlineStatusService onlineStatusService;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final AuthServiceResolveService authServiceResolveService;
    private final AnomalyAlertService anomalyAlertService;
    private final RedisService redisService;

    @Override
    @Transactional
    public void handleAnomalyAnalysed(AnomalyEvent event, String correlationId) {
        if (!Boolean.TRUE.equals(event.isAnomaly())) {
            return;
        }

        UUID childrenId = event.userId();

        if (!tryAcquireAlertCoolTime(childrenId)) {
            return;
        }

        ParentReceiverInfo receiverInfo =
            authServiceResolveService.resolveParentByChildrenId(childrenId);

        NotificationPayload payload = NotificationPayload.builder()
            .title("주의 필요")
            .content(String.format(
                "지금 한번 %s에게 관심을 표현해볼까요?",
                receiverInfo.childrenName()
            ))
            .childrenId(receiverInfo.childrenId())
            .childrenName(receiverInfo.childrenName())
            .parentId(receiverInfo.parentId())
            .build();

        send(new NotificationCommand(
            receiverInfo.parentId(),
            ReceiverRole.PARENT,
            NotificationCode.RISK_ALERT,
            payload
        ));

        anomalyAlertService.handleValidAnomaly(childrenId, receiverInfo.parentId(), correlationId);
    }

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

    @Override
    public SliceResponseDto<NotificationResponseDto> getNotifications(
        UUID receiverId,
        Boolean isRead,
        Pageable pageable
    ) {
        Slice<Notification> notifications;

        if (isRead == null) {
            notifications = notificationRepository.findByReceiverIdOrderByCreatedAtDesc(
                receiverId,
                pageable
            );
        } else {
            notifications = notificationRepository.findByReceiverIdAndReadOrderByCreatedAtDesc(
                receiverId,
                isRead,
                pageable
            );
        }

        Slice<NotificationResponseDto> response =
            notifications.map(NotificationResponseDto::from);

        return SliceResponseDto.from(response);
    }

    @Override
    @Transactional
    public void markAsRead(UUID receiverId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndReceiverId(
                notificationId,
                receiverId
            )
            .orElseThrow(() -> new CustomException(
                "알림을 찾을 수 없습니다.",
                ErrorCode.NOTIFICATION_NOT_FOUND
            ));

        notification.markRead();
    }

    @Override
    @Transactional
    public int markAllAsRead(UUID receiverId) {
        return notificationRepository.markAllAsReadByReceiverId(receiverId);
    }

    private boolean tryAcquireAlertCoolTime(UUID childrenId) {
        return redisService.setIfAbsent(
            anomalyCoolTimeKey(childrenId),
            "1",
            Duration.ofMinutes(Constants.ALERT_COOL_TIME)
        );
    }

    private String anomalyCoolTimeKey(UUID childrenId) {
        return Constants.ALERT_COOL_TIME_KEY_PREFIX + ":" + childrenId;
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

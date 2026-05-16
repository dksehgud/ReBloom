package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.common.dto.SliceResponseDto;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.event.dto.AnomalyEvent;
import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.response.NotificationResponseDto;
import com.ssafy.rebloom.notification_service.repository.NotificationRepository;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertService;
import com.ssafy.rebloom.notification_service.service.AuthServiceResolveService;
import com.ssafy.rebloom.notification_service.service.NotificationAlertSender;
import com.ssafy.rebloom.notification_service.service.NotificationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthServiceResolveService authServiceResolveService;
    private final AnomalyAlertService anomalyAlertService;
    private final NotificationAlertSender notificationAlertSender;

    @Override
    @Transactional
    public void handleAnomalyAnalysed(AnomalyEvent event, String correlationId) {
        if (!Boolean.TRUE.equals(event.isAnomaly())) {
            return;
        }

        UUID childrenId = event.userId();

        ParentReceiverInfo receiverInfo =
            authServiceResolveService.resolveParentByChildrenId(childrenId);

        anomalyAlertService.startPhase(receiverInfo, correlationId);
    }

    @Override
    @Transactional
    public void send(NotificationCommand command) {
        notificationAlertSender.send(command);
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

}

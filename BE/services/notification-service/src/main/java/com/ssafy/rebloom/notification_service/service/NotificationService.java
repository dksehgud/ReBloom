package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.common.dto.SliceResponseDto;
import com.ssafy.rebloom.event.dto.AnomalyEvent;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.response.NotificationResponseDto;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    void handleAnomalyAnalysed(AnomalyEvent event, String correlationId);

    void send(NotificationCommand command);

    SliceResponseDto<NotificationResponseDto> getNotifications(UUID receiverId, Boolean isRead, Pageable pageable);

    void markAsRead(UUID receiverId, Long notificationId);

    int markAllAsRead(UUID receiverId);
}

package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationType;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.repository.NotificationTypeRepository;
import com.ssafy.rebloom.notification_service.service.NotificationTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationTypeServiceImpl implements NotificationTypeService {

    private final NotificationTypeRepository notificationTypeRepository;

    public NotificationType resolve(NotificationCode code) {
        return notificationTypeRepository.findByName(code.name())
            .orElseThrow(() -> new IllegalStateException("Notification type not found: " + code.name()));
    }
}

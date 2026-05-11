package com.ssafy.rebloom.notification_service.resolver;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationType;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.repository.NotificationTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationTypeResolver {

    private final NotificationTypeRepository notificationTypeRepository;

    public NotificationType resolve(NotificationCode code) {
        return notificationTypeRepository.findByName(code.name())
            .orElseThrow(() -> new IllegalStateException("Notification type not found: " + code.name()));
    }
}
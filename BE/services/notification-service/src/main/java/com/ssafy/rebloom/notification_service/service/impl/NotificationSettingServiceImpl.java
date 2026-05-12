package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationSetting;
import com.ssafy.rebloom.notification_service.repository.NotificationSettingRepository;
import com.ssafy.rebloom.notification_service.service.NotificationSettingService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationSettingServiceImpl implements NotificationSettingService {

    private final NotificationSettingRepository notificationSettingRepository;
    @Override
    public boolean isEnabled(UUID userId) {
        return notificationSettingRepository.findByUserId(userId)
            .map(NotificationSetting::isEnabled)
            .orElse(true);
    }
}

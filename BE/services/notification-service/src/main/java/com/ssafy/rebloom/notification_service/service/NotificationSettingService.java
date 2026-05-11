package com.ssafy.rebloom.notification_service.service;

import java.util.UUID;

public interface NotificationSettingService {

    boolean isEnabled(UUID userId);
}

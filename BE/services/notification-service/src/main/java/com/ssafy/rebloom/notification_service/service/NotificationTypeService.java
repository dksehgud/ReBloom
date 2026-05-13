package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationType;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;

public interface NotificationTypeService {
    NotificationType resolve(NotificationCode code);
}

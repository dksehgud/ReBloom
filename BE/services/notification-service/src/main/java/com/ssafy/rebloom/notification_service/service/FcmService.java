package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.domain.entity.Notification;

public interface FcmService {
    boolean send(Notification notification);
}

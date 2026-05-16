package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.NotificationCommand;

public interface NotificationAlertSender {

    void send(NotificationCommand command);
}

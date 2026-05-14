package com.ssafy.rebloom.notification_service.scheduler;

import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.service.NotificationSseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SseHeartbeatScheduler {

    private final NotificationSseService notificationSseService;

    @Scheduled(fixedDelay = Constants.SSE_HEARTBEAT_INTERVAL_MS)
    public void sendHeartbeat() {
        notificationSseService.sendHeartbeat();
    }
}
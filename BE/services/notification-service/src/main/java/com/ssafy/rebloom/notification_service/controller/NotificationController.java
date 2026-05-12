package com.ssafy.rebloom.notification_service.controller;

import com.ssafy.rebloom.notification_service.service.NotificationSseService;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import com.ssafy.rebloom.security.annotation.LoginUserRole;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationSseService notificationSseService;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(
        @LoginUserId UUID userId,
        @LoginUserRole String userRole
    ) {
        return notificationSseService.connect(userId, userRole);
    }

}

package com.ssafy.rebloom.notification_service.controller;

import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.service.NotificationSseService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationSseController {

    private final NotificationSseService notificationSseService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        UUID userId = currentUserId();
        ReceiverRole role = currentUserRole();
        return notificationSseService.connect(userId, role);
    }

    private UUID currentUserId() {
        // TODO security-module의 인증 principal에서 userId 추출
        throw new UnsupportedOperationException("currentUserId is not implemented yet");
    }

    private ReceiverRole currentUserRole() {
        // TODO security-module의 인증 principal에서 role 추출
        throw new UnsupportedOperationException("currentUserRole is not implemented yet");
    }
}

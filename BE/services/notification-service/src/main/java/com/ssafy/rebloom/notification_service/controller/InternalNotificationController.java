package com.ssafy.rebloom.notification_service.controller;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.request.InternalNotificationSendRequestDto;
import com.ssafy.rebloom.notification_service.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/internal/notifications")
public class InternalNotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<BaseResponse<Void>> send(
        @RequestBody @Valid InternalNotificationSendRequestDto request
    ) {
        notificationService.send(new NotificationCommand(
            request.receiverId(),
            request.receiverRole(),
            request.notificationCode(),
            request.toPayload()
        ));

        return ResponseEntity.ok(BaseResponse.success("내부 알림 생성 요청 성공"));
    }
}
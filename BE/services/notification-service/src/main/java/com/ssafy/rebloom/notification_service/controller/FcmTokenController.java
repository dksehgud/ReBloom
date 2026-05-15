package com.ssafy.rebloom.notification_service.controller;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.notification_service.dto.request.FcmTokenDeactivateRequestDto;
import com.ssafy.rebloom.notification_service.dto.request.FcmTokenRegisterRequestDto;
import com.ssafy.rebloom.notification_service.service.FcmTokenService;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications/fcm-tokens")
@RequiredArgsConstructor
public class FcmTokenController {

    private final FcmTokenService fcmTokenService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<Void>> register(
        @LoginUserId UUID userId,
        @RequestBody @Valid FcmTokenRegisterRequestDto request
    ) {
        fcmTokenService.register(userId, request);
        return ResponseEntity.ok(BaseResponse.success("FCM token registered successfully."));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<Void>> deactivate(
        @LoginUserId UUID userId,
        @RequestBody @Valid FcmTokenDeactivateRequestDto request
    ) {
        fcmTokenService.deactivate(userId, request);
        return ResponseEntity.ok(BaseResponse.success("FCM token deactivated successfully."));
    }
}

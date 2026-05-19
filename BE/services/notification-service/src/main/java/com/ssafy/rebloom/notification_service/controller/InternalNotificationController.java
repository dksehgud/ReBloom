package com.ssafy.rebloom.notification_service.controller;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.notification_service.dto.request.ConversationAttemptResultRequestDto;
import com.ssafy.rebloom.notification_service.service.ConversationAttemptResultNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/internal/notifications")
@RequiredArgsConstructor
public class InternalNotificationController {

    private final ConversationAttemptResultNotificationService conversationAttemptResultNotificationService;

    @PostMapping("/conversation-attempt-result")
    public ResponseEntity<BaseResponse<Void>> handleConversationAttemptResult(
        @RequestBody @Valid ConversationAttemptResultRequestDto request
    ) {
        conversationAttemptResultNotificationService.handleConversationAttemptResult(request);
        return ResponseEntity.ok(BaseResponse.success("AIoT 대화 시도 결과 처리 성공"));
    }
}
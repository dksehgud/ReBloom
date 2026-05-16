package com.ssafy.rebloom.notification_service.controller;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.common.dto.SliceResponseDto;
import com.ssafy.rebloom.notification_service.dto.request.AnomalyAlertPhaseActionRequestDto;
import com.ssafy.rebloom.notification_service.dto.request.DiaryReminderSettingUpdateRequestDto;
import com.ssafy.rebloom.notification_service.dto.response.DiaryReminderSettingResponseDto;
import com.ssafy.rebloom.notification_service.dto.response.NotificationResponseDto;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertService;
import com.ssafy.rebloom.notification_service.service.NotificationService;
import com.ssafy.rebloom.notification_service.service.NotificationSettingService;
import com.ssafy.rebloom.notification_service.service.NotificationSseService;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import com.ssafy.rebloom.security.annotation.LoginUserRole;
import com.ssafy.rebloom.security.annotation.RequestId;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationSseService notificationSseService;
    private final NotificationService notificationService;
    private final NotificationSettingService notificationSettingService;
    private final AnomalyAlertService anomalyAlertService;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter subscribe(
        @LoginUserId UUID userId,
        @LoginUserRole String userRole
    ) {
        return notificationSseService.connect(userId, userRole);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<SliceResponseDto<NotificationResponseDto>>> getNotifications(
        @LoginUserId UUID userId,
        @RequestParam(required = false) Boolean isRead,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(
            page,
            size,
            Sort.by(Sort.Direction.DESC, "createdAt")
        );

        SliceResponseDto<NotificationResponseDto> response = notificationService.getNotifications(
            userId,
            isRead,
            pageable
        );

        return ResponseEntity.ok(
            BaseResponse.success("알림 목록 조회 성공", response)
        );
    }

    @PatchMapping("/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<Void>> markAsRead(
        @LoginUserId UUID userId,
        @PathVariable Long notificationId
    ) {
        notificationService.markAsRead(userId, notificationId);
        return ResponseEntity.ok(BaseResponse.success("알림 읽음 처리 성공"));
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<Integer>> markAllAsRead(
        @LoginUserId UUID userId
    ) {
        int updatedCount = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(
            BaseResponse.success("전체 알림 읽음 처리 성공", updatedCount)
        );
    }

    @GetMapping("/settings")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<DiaryReminderSettingResponseDto>> getDiaryReminderSetting(
        @LoginUserId UUID userId
    ) {
        DiaryReminderSettingResponseDto response =
            notificationSettingService.getDiaryReminderSetting(userId);

        return ResponseEntity.ok(
            BaseResponse.success("알림 설정 조회 성공", response)
        );
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<DiaryReminderSettingResponseDto>> updateDiaryReminderSetting(
        @LoginUserId UUID userId,
        @RequestBody @Valid DiaryReminderSettingUpdateRequestDto request
    ) {
        DiaryReminderSettingResponseDto response =
            notificationSettingService.updateDiaryReminderSetting(userId, request);

        return ResponseEntity.ok(
            BaseResponse.success("알림 설정 수정 성공", response)
        );
    }

    @PostMapping("/anomaly-alert/confirm")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<Void>> confirmAnomalyAlertPhase(
        @LoginUserId UUID parentId,
        @RequestBody @Valid AnomalyAlertPhaseActionRequestDto request
    ) {
        anomalyAlertService.confirmPhase(parentId, request.childrenId());
        return ResponseEntity.ok(BaseResponse.success("이상치 알림을 확인 처리했습니다."));
    }

    @PostMapping("/anomaly-alert/reject")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<Void>> rejectAnomalyAlertPhase(
        @LoginUserId UUID parentId,
        @RequestBody @Valid AnomalyAlertPhaseActionRequestDto request,
        @RequestId String requestId
    ) {
        anomalyAlertService.rejectPhase(parentId, request.childrenId(), requestId);
        return ResponseEntity.ok(BaseResponse.success("이상치 알림을 불가 처리했습니다."));
    }
}

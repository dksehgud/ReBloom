package com.ssafy.rebloom.report_service.report.controller;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.report_service.analysis.service.StatusCardService;
import com.ssafy.rebloom.report_service.report.dto.request.ChildrenReportCreateRequestDto;
import com.ssafy.rebloom.report_service.report.dto.request.ChildrenReportUpdateRequestDto;
import com.ssafy.rebloom.report_service.report.dto.response.ChildrenReportDetailResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.ChildrenReportListResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.DiaryEmotionResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.StatusCardResponseDto;
import com.ssafy.rebloom.report_service.report.service.ChildrenReportService;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import com.ssafy.rebloom.security.annotation.LoginUserRole;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class ChildrenReportController {

    private final ChildrenReportService childrenReportService;
    private final StatusCardService statusCardService;

    @PostMapping("/children/{childrenId}/reports")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<Void>> create(
        @LoginUserId UUID parentId,
        @PathVariable UUID childrenId,
        @RequestBody @Valid ChildrenReportCreateRequestDto request
    ) {
        childrenReportService.create(parentId, childrenId, request);
        return ResponseEntity.ok(BaseResponse.success("아이 관찰 기록이 작성되었습니다."));
    }

    @PatchMapping("/children/{childrenId}/reports/{reportId}")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<Void>> update(
        @LoginUserId UUID parentId,
        @PathVariable UUID childrenId,
        @PathVariable UUID reportId,
        @RequestBody @Valid ChildrenReportUpdateRequestDto request
    ) {
        childrenReportService.update(parentId, childrenId, reportId, request);
        return ResponseEntity.ok(BaseResponse.success("아이 관찰 기록이 수정되었습니다."));
    }

    @DeleteMapping("/children/{childrenId}/reports/{reportId}")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<Void>> delete(
        @LoginUserId UUID parentId,
        @PathVariable UUID childrenId,
        @PathVariable UUID reportId
    ) {
        childrenReportService.delete(parentId, childrenId, reportId);
        return ResponseEntity.ok(BaseResponse.success("아이 관찰 기록이 삭제되었습니다."));
    }

    @GetMapping("/children/{childrenId}/reports/{reportId}")
    @PreAuthorize("hasAnyRole('PARENT', 'COUNSELOR')")
    public ResponseEntity<ChildrenReportDetailResponseDto> getReport(
        @LoginUserId UUID userId,
        @LoginUserRole String role,
        @PathVariable UUID childrenId,
        @PathVariable UUID reportId
    ) {
        return ResponseEntity.ok(childrenReportService.getReportDetail(userId, role, childrenId, reportId));
    }

    @GetMapping("/children/{childrenId}/reports")
    @PreAuthorize("hasAnyRole('PARENT', 'COUNSELOR')")
    public ResponseEntity<ChildrenReportListResponseDto> getReports(
        @LoginUserId UUID userId,
        @LoginUserRole String role,
        @PathVariable UUID childrenId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(childrenReportService.getReports(userId, role, childrenId, startDate, endDate));
    }

    @GetMapping("/children/{childrenId}/diaries/emotions")
    @PreAuthorize("hasAnyRole('PARENT', 'COUNSELOR')")
    public ResponseEntity<DiaryEmotionResponseDto> getDiaryEmotionIndicators(
        @LoginUserId UUID userId,
        @LoginUserRole String role,
        @PathVariable UUID childrenId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(childrenReportService.getDiaryEmotionIndicators(userId, role, childrenId, startDate, endDate));
    }

    @GetMapping("/children/{childrenId}/status-cards")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<StatusCardResponseDto>> getStatusCard(
        @LoginUserId UUID parentId,
        @PathVariable UUID childrenId
    ) {
        return statusCardService.getRecentStatusCard(parentId, childrenId)
            .map(statusCard -> ResponseEntity.ok(
                BaseResponse.success("상태 카드 조회 성공", statusCard)
            ))
            .orElseGet(() -> ResponseEntity.ok(
                BaseResponse.success("조회 가능한 상태 카드가 없습니다.")
            ));
    }
}

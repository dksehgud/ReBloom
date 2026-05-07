package com.ssafy.rebloom.report_service.report.controller;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.report_service.report.dto.request.CounselorCommentCreateRequestDto;
import com.ssafy.rebloom.report_service.report.dto.response.CounselorCommentListResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.CounselorCommentResponseDto;
import com.ssafy.rebloom.report_service.report.service.CounselorCommentService;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import com.ssafy.rebloom.security.annotation.LoginUserRole;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/children/{childrenId}/reports/{reportId}/comments")
public class CounselorCommentController {

    private final CounselorCommentService counselorCommentService;

    @PostMapping
    @PreAuthorize("hasRole('COUNSELOR')")
    public ResponseEntity<CounselorCommentResponseDto> create(
        @LoginUserId UUID counselorId,
        @PathVariable UUID childrenId,
        @PathVariable UUID reportId,
        @RequestBody @Valid CounselorCommentCreateRequestDto request
    ) {
        return ResponseEntity.ok(counselorCommentService.create(counselorId, childrenId, reportId, request));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasRole('COUNSELOR')")
    public ResponseEntity<BaseResponse<Void>> delete(
        @LoginUserId UUID counselorId,
        @PathVariable UUID childrenId,
        @PathVariable UUID reportId,
        @PathVariable UUID commentId
    ) {
        counselorCommentService.delete(counselorId, childrenId, reportId, commentId);
        return ResponseEntity.ok(BaseResponse.success("상담사 코멘트가 삭제되었습니다."));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PARENT', 'COUNSELOR')")
    public ResponseEntity<CounselorCommentListResponseDto> getComments(
        @LoginUserId UUID userId,
        @LoginUserRole String role,
        @PathVariable UUID childrenId,
        @PathVariable UUID reportId
    ) {
        return ResponseEntity.ok(counselorCommentService.getComments(userId, role, childrenId, reportId));
    }
}

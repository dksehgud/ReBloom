package com.ssafy.rebloom.report_service.report.service;

import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.report.domain.entity.ChildrenReport;
import com.ssafy.rebloom.report_service.report.domain.entity.CounselorComment;
import com.ssafy.rebloom.report_service.report.dto.request.CounselorCommentCreateRequestDto;
import com.ssafy.rebloom.report_service.report.dto.response.CounselorCommentListResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.CounselorCommentResponseDto;
import com.ssafy.rebloom.report_service.report.repository.ChildrenReportRepository;
import com.ssafy.rebloom.report_service.report.repository.CounselorCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CounselorCommentService {

    private final CounselorCommentRepository counselorCommentRepository;
    private final ChildrenReportRepository childrenReportRepository;
    private final AuthAccessClient authAccessClient;

    @Transactional
    public CounselorCommentResponseDto create(
        UUID counselorId,
        UUID childrenId,
        UUID reportId,
        CounselorCommentCreateRequestDto request
    ) {
        ChildrenReport childrenReport = getReport(reportId);
        validateReportChild(childrenReport, childrenId);
        authAccessClient.validateCounselorChildAccess(counselorId, childrenId);

        CounselorComment counselorComment = CounselorComment.builder()
            .id(UUID.randomUUID())
            .userId(counselorId)
            .parentReportId(reportId)
            .context(request.context())
            .build();

        return toResponse(counselorCommentRepository.save(counselorComment));
    }

    @Transactional
    public void delete(UUID counselorId, UUID childrenId, UUID reportId, UUID commentId) {
        ChildrenReport childrenReport = getReport(reportId);
        validateReportChild(childrenReport, childrenId);
        authAccessClient.validateCounselorChildAccess(counselorId, childrenId);

        CounselorComment counselorComment = getComment(commentId);
        validateCommentReport(counselorComment, reportId);
        if (!counselorComment.isWrittenBy(counselorId)) {
            throw new CustomException("본인이 작성한 코멘트만 삭제할 수 있습니다.", ErrorCode.FORBIDDEN);
        }

        counselorCommentRepository.delete(counselorComment);
    }

    public CounselorCommentListResponseDto getComments(UUID userId, String role, UUID childrenId, UUID reportId) {
        ChildrenReport childrenReport = getReport(reportId);
        validateReportChild(childrenReport, childrenId);
        validateReadAccess(userId, role, childrenReport);

        return CounselorCommentListResponseDto.builder()
            .commentList(counselorCommentRepository.findByParentReportId(reportId)
                .stream()
                .map(this::toResponse)
                .toList())
            .build();
    }

    private ChildrenReport getReport(UUID reportId) {
        return childrenReportRepository.findById(reportId)
            .orElseThrow(() -> new CustomException("아이 관찰 기록을 찾을 수 없습니다.", ErrorCode.NOT_FOUND));
    }

    private CounselorComment getComment(UUID commentId) {
        return counselorCommentRepository.findById(commentId)
            .orElseThrow(() -> new CustomException("상담사 코멘트를 찾을 수 없습니다.", ErrorCode.NOT_FOUND));
    }

    private void validateReportChild(ChildrenReport childrenReport, UUID childrenId) {
        if (!childrenReport.getChildrenId().equals(childrenId)) {
            throw new CustomException("해당 아이의 관찰 기록이 아닙니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private void validateCommentReport(CounselorComment counselorComment, UUID reportId) {
        if (!counselorComment.getParentReportId().equals(reportId)) {
            throw new CustomException("해당 관찰 기록의 코멘트가 아닙니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private void validateReadAccess(UUID userId, String role, ChildrenReport childrenReport) {
        if ("PARENT".equals(role)) {
            authAccessClient.validateParentChildAccess(userId, childrenReport.getChildrenId());
            return;
        }

        if ("COUNSELOR".equals(role)) {
            authAccessClient.validateCounselorChildAccess(userId, childrenReport.getChildrenId());
            return;
        }

        throw new CustomException("상담사 코멘트를 조회할 권한이 없습니다.", ErrorCode.FORBIDDEN);
    }

    private CounselorCommentResponseDto toResponse(CounselorComment counselorComment) {
        return CounselorCommentResponseDto.builder()
            .commentId(counselorComment.getId())
            .counselorId(counselorComment.getUserId())
            .reportId(counselorComment.getParentReportId())
            .context(counselorComment.getContext())
            .createdAt(counselorComment.getCreatedAt())
            .build();
    }
}

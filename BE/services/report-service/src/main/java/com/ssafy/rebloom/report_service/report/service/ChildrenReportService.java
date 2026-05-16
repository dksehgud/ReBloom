package com.ssafy.rebloom.report_service.report.service;

import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.domain.entity.DiaryAnalysis;
import com.ssafy.rebloom.report_service.analysis.repository.DiaryAnalysisRepository;
import com.ssafy.rebloom.report_service.report.domain.entity.ChildrenReport;
import com.ssafy.rebloom.report_service.report.domain.entity.CounselorComment;
import com.ssafy.rebloom.report_service.report.dto.request.ChildrenReportCreateRequestDto;
import com.ssafy.rebloom.report_service.report.dto.request.ChildrenReportUpdateRequestDto;
import com.ssafy.rebloom.report_service.report.dto.response.ChildrenReportDetailResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.ChildrenReportGroupResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.ChildrenReportListResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.ChildrenReportResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.CounselorCommentResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.DiaryEmotionPointResponseDto;
import com.ssafy.rebloom.report_service.report.dto.response.DiaryEmotionResponseDto;
import com.ssafy.rebloom.report_service.report.event.ParentReportCreatedLocalEvent;
import com.ssafy.rebloom.report_service.report.repository.ChildrenReportRepository;
import com.ssafy.rebloom.report_service.report.repository.CounselorCommentRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChildrenReportService {

    private final ChildrenReportRepository childrenReportRepository;
    private final CounselorCommentRepository counselorCommentRepository;
    private final DiaryAnalysisRepository diaryAnalysisRepository;
    private final AuthAccessClient authAccessClient;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Transactional
    public ChildrenReportResponseDto create(UUID parentId, UUID childrenId, ChildrenReportCreateRequestDto request) {
        validateNotFuture(request.reportDate());
        authAccessClient.validateParentChildAccess(parentId, childrenId);

        ChildrenReport childrenReport = ChildrenReport.builder()
            .id(UUID.randomUUID())
            .childrenId(childrenId)
            .parentId(parentId)
            .emotionTag(request.emotionTag())
            .context(request.context())
            .reportDate(request.reportDate())
            .hasCounselorComment(false)
            .build();

        ChildrenReport savedReport = childrenReportRepository.save(childrenReport);

        applicationEventPublisher.publishEvent(
            new ParentReportCreatedLocalEvent(
                savedReport.getId(),
                savedReport.getChildrenId(),
                savedReport.getParentId(),
                savedReport.getReportDate(),
                savedReport.getCreatedAt()
            )
        );

        return toResponse(savedReport);
    }

    @Transactional
    public ChildrenReportResponseDto update(
        UUID parentId,
        UUID childrenId,
        UUID reportId,
        ChildrenReportUpdateRequestDto request
    ) {
        validateNotFuture(request.reportDate());
        ChildrenReport childrenReport = findReport(reportId);
        validateReportOwner(childrenReport, parentId);
        validateReportChild(childrenReport, childrenId);
        authAccessClient.validateParentChildAccess(parentId, childrenReport.getChildrenId());

        childrenReport.update(request.emotionTag(), request.context(), request.reportDate());
        return toResponse(childrenReport);
    }

    @Transactional
    public void delete(UUID parentId, UUID childrenId, UUID reportId) {
        ChildrenReport childrenReport = findReport(reportId);
        validateReportOwner(childrenReport, parentId);
        validateReportChild(childrenReport, childrenId);
        authAccessClient.validateParentChildAccess(parentId, childrenReport.getChildrenId());

        childrenReportRepository.delete(childrenReport);
    }

    public ChildrenReportListResponseDto getReports(
        UUID userId,
        String role,
        UUID childrenId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        validateReadAccess(userId, role, childrenId);

        Map<LocalDate, List<ChildrenReport>> reportsByDate = findReports(childrenId, startDate, endDate)
            .stream()
            .collect(Collectors.groupingBy(
                report -> report.getReportDate().toLocalDate(),
                TreeMap::new,
                Collectors.toList()
            ));

        return ChildrenReportListResponseDto.builder()
            .dailyReports(reportsByDate.entrySet().stream()
                .map(entry -> ChildrenReportGroupResponseDto.builder()
                    .date(entry.getKey())
                    .reportList(entry.getValue().stream()
                        .map(this::toResponse)
                        .toList())
                    .build())
                .toList())
            .build();
    }

    public ChildrenReportDetailResponseDto getReportDetail(
        UUID userId,
        String role,
        UUID childrenId,
        UUID reportId
    ) {
        ChildrenReport childrenReport = findReport(reportId);
        validateReportChild(childrenReport, childrenId);
        validateReadAccess(userId, role, childrenId);

        CounselorCommentResponseDto counselorComment = counselorCommentRepository.findByParentReportId(reportId)
            .map(this::toCommentResponse)
            .orElse(null);

        return ChildrenReportDetailResponseDto.builder()
            .reportId(childrenReport.getId())
            .childrenId(childrenReport.getChildrenId())
            .parentId(childrenReport.getParentId())
            .emotionTag(childrenReport.getEmotionTag())
            .context(childrenReport.getContext())
            .reportDate(childrenReport.getReportDate())
            .hasCounselorComment(childrenReport.isHasCounselorComment())
            .counselorComment(counselorComment)
            .build();
    }

    public DiaryEmotionResponseDto getDiaryEmotionIndicators(
        UUID userId,
        String role,
        UUID childrenId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        validateReadAccess(userId, role, childrenId);

        return DiaryEmotionResponseDto.builder()
            .emotionList(diaryAnalysisRepository.findByPeriod(
                    childrenId,
                    startDate.atStartOfDay(),
                    endDate.plusDays(1).atStartOfDay().minusNanos(1)
                )
                .stream()
                .map(this::toDiaryEmotionPointResponse)
                .toList())
            .build();
    }

    private List<ChildrenReport> findReports(UUID childrenId, LocalDate startDate, LocalDate endDate) {
        return childrenReportRepository.findReportsByDateRange(
            childrenId,
            startDate.atStartOfDay(),
            endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    private ChildrenReport findReport(UUID reportId) {
        return childrenReportRepository.findById(reportId)
            .orElseThrow(() -> new CustomException("아이 관찰 기록을 찾을 수 없습니다.", ErrorCode.NOT_FOUND));
    }

    private void validateReportOwner(ChildrenReport childrenReport, UUID parentId) {
        if (!childrenReport.getParentId().equals(parentId)) {
            throw new CustomException("본인이 작성한 관찰 기록만 수정하거나 삭제할 수 있습니다.", ErrorCode.FORBIDDEN);
        }
    }

    private void validateReportChild(ChildrenReport childrenReport, UUID childrenId) {
        if (!childrenReport.getChildrenId().equals(childrenId)) {
            throw new CustomException("해당 아이의 관찰 기록이 아닙니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private void validateReadAccess(UUID userId, String role, UUID childrenId) {
        String normalizedRole = normalizeRole(role);
        if ("PARENT".equals(normalizedRole)) {
            authAccessClient.validateParentChildAccess(userId, childrenId);
            return;
        }

        if ("COUNSELOR".equals(normalizedRole)) {
            authAccessClient.validateCounselorChildAccess(userId, childrenId);
            return;
        }

        throw new CustomException("아이 관찰 기록을 조회할 권한이 없습니다.", ErrorCode.FORBIDDEN);
    }

    private String normalizeRole(String role) {
        return role != null && role.startsWith("ROLE_")
            ? role.substring("ROLE_".length())
            : role;
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new CustomException("시작일은 종료일보다 늦을 수 없습니다.", ErrorCode.INVALID_PARAMETER);
        }

        if (startDate.isAfter(LocalDate.now()) || endDate.isAfter(LocalDate.now())) {
            throw new CustomException("미래 날짜는 조회할 수 없습니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private void validateNotFuture(LocalDateTime reportDate) {
        if (reportDate.isAfter(LocalDateTime.now())) {
            throw new CustomException("미래 날짜로 관찰 기록을 작성할 수 없습니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private ChildrenReportResponseDto toResponse(ChildrenReport childrenReport) {
        return ChildrenReportResponseDto.builder()
            .reportId(childrenReport.getId())
            .childrenId(childrenReport.getChildrenId())
            .parentId(childrenReport.getParentId())
            .emotionTag(childrenReport.getEmotionTag())
            .context(childrenReport.getContext())
            .reportDate(childrenReport.getReportDate())
            .hasCounselorComment(childrenReport.isHasCounselorComment())
            .build();
    }

    private DiaryEmotionPointResponseDto toDiaryEmotionPointResponse(DiaryAnalysis diaryAnalysis) {
        return DiaryEmotionPointResponseDto.builder()
            .targetDate(diaryAnalysis.getTargetDate())
            .emotionIcon(diaryAnalysis.getEmotionIcon())
            .build();
    }

    private CounselorCommentResponseDto toCommentResponse(CounselorComment counselorComment) {
        return CounselorCommentResponseDto.builder()
            .commentId(counselorComment.getId())
            .counselorId(counselorComment.getUserId())
            .reportId(counselorComment.getParentReportId())
            .context(counselorComment.getContext())
            .createdAt(counselorComment.getCreatedAt())
            .build();
    }
}

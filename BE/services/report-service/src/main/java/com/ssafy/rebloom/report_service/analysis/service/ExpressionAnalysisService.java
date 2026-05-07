package com.ssafy.rebloom.report_service.analysis.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.dto.response.AnalysisDailyGroupResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.AnalysisContentResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ConversationAnalysisCardResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ConversationChartResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ConversationChartPointResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.DiaryChartPointResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.DiaryChartResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.DiaryAnalysisCardResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.EmotionFlowResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ExpressionAnalysisResponse;
import com.ssafy.rebloom.report_service.analysis.domain.entity.ConversationAnalysis;
import com.ssafy.rebloom.report_service.analysis.domain.entity.DiaryAnalysis;
import com.ssafy.rebloom.report_service.analysis.repository.ConversationAnalysisRepository;
import com.ssafy.rebloom.report_service.analysis.repository.ConversationKeywordRepository;
import com.ssafy.rebloom.report_service.analysis.repository.DiaryAnalysisRepository;
import com.ssafy.rebloom.report_service.analysis.repository.DiaryKeywordRepository;
import com.ssafy.rebloom.report_service.analysis.repository.KeywordProjection;
import com.ssafy.rebloom.report_service.report.repository.RecentTrendRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpressionAnalysisService {

    private final AuthAccessClient authAccessClient;
    private final DiaryAnalysisRepository diaryAnalysisRepository;
    private final DiaryKeywordRepository diaryKeywordRepository;
    private final ConversationAnalysisRepository conversationAnalysisRepository;
    private final ConversationKeywordRepository conversationKeywordRepository;
    private final RecentTrendRepository recentTrendRepository;

    public ExpressionAnalysisResponse getExpressionAnalysis(
            UUID counselorId,
            UUID childId
    ) {
        authAccessClient.validateCounselorChildAccess(counselorId, childId);
        String summary = recentTrendRepository.findLatestByUserId(childId)
                .map(recentTrend -> recentTrend.getSummary())
                .orElse(null);

        return ExpressionAnalysisResponse.builder()
                .summary(summary)
                .build();
    }

    public EmotionFlowResponse getEmotionFlow(
            UUID counselorId,
            UUID childId,
            LocalDate baseDate,
            String period,
            String type
    ) {
        validateBaseDate(baseDate);
        authAccessClient.validateCounselorChildAccess(counselorId, childId);

        DateRange dateRange = resolveDateRange(baseDate, period);
        String normalizedType = normalizeType(type);
        List<DiaryAnalysis> diaryAnalyses = shouldIncludeDiary(normalizedType)
                ? findDiaryAnalyses(childId, dateRange.startDate(), dateRange.endDate())
                : List.of();
        List<ConversationAnalysis> conversationAnalyses = shouldIncludeConversation(normalizedType)
                ? findConversationAnalyses(childId, dateRange.startDate(), dateRange.endDate())
                : List.of();

        return EmotionFlowResponse.builder()
                .diaryList(diaryAnalyses.stream()
                        .map(this::toDiaryChartPointResponse)
                        .toList())
                .conversationList(conversationAnalyses.stream()
                        .map(this::toConversationChartPointResponse)
                        .toList())
                .build();
    }

    public DiaryChartResponse getDiaryAnalysisChart(
            UUID counselorId,
            UUID childId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        authAccessClient.validateCounselorChildAccess(counselorId, childId);

        List<DiaryAnalysis> analyses = findDiaryAnalyses(childId, startDate, endDate);

        return DiaryChartResponse.builder()
                .diaryList(analyses.stream()
                        .map(this::toDiaryChartPointResponse)
                        .toList())
                .build();
    }

    public AnalysisContentResponse getDiaryAnalysisContent(
            UUID counselorId,
            UUID childId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        authAccessClient.validateCounselorChildAccess(counselorId, childId);

        List<DiaryAnalysis> analyses = diaryAnalysisRepository.findByPeriod(
                childId,
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
        Map<UUID, List<String>> keywordsByAnalysisId = getDiaryKeywordsByAnalysisId(childId, analyses);

        List<AnalysisDailyGroupResponse> dailyGroups = analyses.stream()
                .collect(Collectors.groupingBy(
                        analysis -> analysis.getTargetDate().toLocalDate(),
                        TreeMap::new,
                        Collectors.toList()
                ))
                .entrySet()
                .stream()
                .map(entry -> AnalysisDailyGroupResponse.builder()
                        .date(entry.getKey())
                        .dayOfWeek(entry.getKey().getDayOfWeek().name())
                        .diaryCards(entry.getValue().stream()
                                .map(analysis -> toDiaryAnalysisCardResponse(
                                        analysis,
                                        keywordsByAnalysisId.getOrDefault(analysis.getId().getId(), List.of())
                                ))
                                .toList())
                        .conversationCards(List.of())
                        .build())
                .toList();

        return AnalysisContentResponse.builder()
                .dailyGroups(dailyGroups)
                .build();
    }

    public ConversationChartResponse getConversationAnalysisChart(
            UUID counselorId,
            UUID childId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        authAccessClient.validateCounselorChildAccess(counselorId, childId);

        List<ConversationAnalysis> analyses = findConversationAnalyses(childId, startDate, endDate);

        return ConversationChartResponse.builder()
                .conversationList(analyses.stream()
                        .map(this::toConversationChartPointResponse)
                        .toList())
                .build();
    }

    public AnalysisContentResponse getConversationAnalysisContent(
            UUID counselorId,
            UUID childId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        authAccessClient.validateCounselorChildAccess(counselorId, childId);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay().minusNanos(1);
        List<ConversationAnalysis> analyses = conversationAnalysisRepository.findByPeriod(
                childId,
                startDateTime,
                endDateTime
        );
        Map<UUID, List<String>> keywordsByAnalysisId = getConversationKeywordsByAnalysisId(childId, analyses);

        List<AnalysisDailyGroupResponse> dailyGroups = analyses.stream()
                .collect(Collectors.groupingBy(
                        analysis -> analysis.getStartedAt().toLocalDate(),
                        TreeMap::new,
                        Collectors.toList()
                ))
                .entrySet()
                .stream()
                .map(entry -> AnalysisDailyGroupResponse.builder()
                        .date(entry.getKey())
                        .dayOfWeek(entry.getKey().getDayOfWeek().name())
                        .diaryCards(List.of())
                        .conversationCards(entry.getValue().stream()
                                .map(analysis -> toConversationAnalysisCardResponse(
                                        analysis,
                                        keywordsByAnalysisId.getOrDefault(analysis.getId().getId(), List.of())
                                ))
                                .toList())
                        .build())
                .toList();

        return AnalysisContentResponse.builder()
                .dailyGroups(dailyGroups)
                .build();
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new CustomException("시작일은 종료일보다 늦을 수 없습니다.", ErrorCode.INVALID_PARAMETER);
        }

        if (startDate.isAfter(LocalDate.now()) || endDate.isAfter(LocalDate.now())) {
            throw new CustomException("미래 날짜는 조회할 수 없습니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private void validateBaseDate(LocalDate baseDate) {
        if (baseDate.isAfter(LocalDate.now())) {
            throw new CustomException("미래 날짜는 조회할 수 없습니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private DateRange resolveDateRange(LocalDate baseDate, String period) {
        LocalDate startDate;
        LocalDate endDate;

        switch (period.toUpperCase()) {
            case "WEEK" -> {
                startDate = baseDate.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                endDate = baseDate.with(TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY));
            }
            case "MONTH" -> {
                YearMonth yearMonth = YearMonth.from(baseDate);
                startDate = yearMonth.atDay(1);
                endDate = yearMonth.atEndOfMonth();
            }
            case "YEAR" -> {
                startDate = baseDate.withDayOfYear(1);
                endDate = baseDate.withDayOfYear(baseDate.lengthOfYear());
            }
            default -> throw new CustomException("지원하지 않는 기간 단위입니다.", ErrorCode.INVALID_PARAMETER);
        }

        LocalDate today = LocalDate.now();
        if (endDate.isAfter(today)) {
            endDate = today;
        }

        return new DateRange(startDate, endDate);
    }

    private String normalizeType(String type) {
        return type == null ? "ALL" : type.toUpperCase();
    }

    private boolean shouldIncludeDiary(String type) {
        return "ALL".equals(type) || "DIARY".equals(type);
    }

    private boolean shouldIncludeConversation(String type) {
        return "ALL".equals(type) || "CONVERSATION".equals(type);
    }

    private List<DiaryAnalysis> findDiaryAnalyses(UUID childId, LocalDate startDate, LocalDate endDate) {
        return diaryAnalysisRepository.findByPeriod(
                childId,
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    private List<ConversationAnalysis> findConversationAnalyses(UUID childId, LocalDate startDate, LocalDate endDate) {
        return conversationAnalysisRepository.findByPeriod(
                childId,
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    private Map<UUID, List<String>> getDiaryKeywordsByAnalysisId(UUID childId, List<DiaryAnalysis> analyses) {
        List<UUID> analysisIds = analyses.stream()
                .map(analysis -> analysis.getId().getId())
                .toList();

        if (analysisIds.isEmpty()) {
            return Map.of();
        }

        return diaryKeywordRepository.findKeywordsByUserIdAndAnalysisIds(childId, analysisIds)
                .stream()
                .collect(Collectors.groupingBy(
                        KeywordProjection::getAnalysisId,
                        Collectors.mapping(
                                KeywordProjection::getKeyword,
                                Collectors.toList()
                        )
                ));
    }

    private Map<UUID, List<String>> getConversationKeywordsByAnalysisId(
            UUID childId,
            List<ConversationAnalysis> analyses
    ) {
        List<UUID> analysisIds = analyses.stream()
                .map(analysis -> analysis.getId().getId())
                .toList();

        if (analysisIds.isEmpty()) {
            return Map.of();
        }

        return conversationKeywordRepository.findKeywordsByUserIdAndAnalysisIds(childId, analysisIds)
                .stream()
                .collect(Collectors.groupingBy(
                        KeywordProjection::getAnalysisId,
                        Collectors.mapping(
                                KeywordProjection::getKeyword,
                                Collectors.toList()
                        )
                ));
    }

    private DiaryAnalysisCardResponse toDiaryAnalysisCardResponse(DiaryAnalysis analysis, List<String> keywords) {
        return DiaryAnalysisCardResponse.builder()
                .analysisId(analysis.getId().getId())
                .targetDate(analysis.getTargetDate())
                .emotionIcon(analysis.getEmotionIcon())
                .embeddingText(analysis.getEmbeddingText())
                .prediction(analysis.getPrediction())
                .keywords(keywords)
                .build();
    }

    private ConversationAnalysisCardResponse toConversationAnalysisCardResponse(
            ConversationAnalysis analysis,
            List<String> keywords
    ) {
        return ConversationAnalysisCardResponse.builder()
                .analysisId(analysis.getId().getId())
                .startedAt(analysis.getStartedAt())
                .endedAt(analysis.getEndedAt())
                .emotionIcon(analysis.getEmotionIcon())
                .embeddingText(analysis.getEmbeddingText())
                .prediction(analysis.getPrediction())
                .aiInitiated(analysis.isAiInitiated())
                .keywords(keywords)
                .build();
    }

    private DiaryChartPointResponse toDiaryChartPointResponse(DiaryAnalysis analysis) {
        return DiaryChartPointResponse.builder()
                .targetDate(analysis.getTargetDate())
                .emotionIcon(analysis.getEmotionIcon())
                .prediction(analysis.getPrediction())
                .build();
    }

    private ConversationChartPointResponse toConversationChartPointResponse(ConversationAnalysis analysis) {
        return ConversationChartPointResponse.builder()
                .startedAt(analysis.getStartedAt())
                .endedAt(analysis.getEndedAt())
                .prediction(analysis.getPrediction())
                .build();
    }

    private record DateRange(LocalDate startDate, LocalDate endDate) {
    }
}

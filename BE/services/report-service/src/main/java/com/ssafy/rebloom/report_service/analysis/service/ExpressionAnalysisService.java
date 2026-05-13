package com.ssafy.rebloom.report_service.analysis.service;

import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.domain.entity.ConversationAnalysis;
import com.ssafy.rebloom.report_service.analysis.domain.entity.DiaryAnalysis;
import com.ssafy.rebloom.report_service.analysis.dto.response.*;
import com.ssafy.rebloom.report_service.analysis.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

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

    public AnalysisContentResponse getAnalysisContent(
        UUID counselorId,
        UUID childId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        authAccessClient.validateCounselorChildAccess(counselorId, childId);

        List<DiaryAnalysis> diaryAnalyses = findDiaryAnalyses(childId, startDate, endDate);
        List<ConversationAnalysis> conversationAnalyses = findConversationAnalyses(childId, startDate, endDate);
        Map<UUID, List<String>> diaryKeywordsByAnalysisId = getDiaryKeywordsByAnalysisId(childId, diaryAnalyses);
        Map<UUID, List<String>> conversationKeywordsByAnalysisId =
            getConversationKeywordsByAnalysisId(childId, conversationAnalyses);

        Map<LocalDate, List<DiaryAnalysisCardResponse>> diaryListByDate = diaryAnalyses.stream()
            .collect(Collectors.groupingBy(
                analysis -> analysis.getTargetDate().toLocalDate(),
                TreeMap::new,
                Collectors.mapping(
                    analysis -> toDiaryAnalysisCardResponse(
                        analysis,
                        diaryKeywordsByAnalysisId.getOrDefault(analysis.getId().getId(), List.of())
                    ),
                    Collectors.toList()
                )
            ));
        Map<LocalDate, List<ConversationAnalysisCardResponse>> conversationListByDate = conversationAnalyses.stream()
            .collect(Collectors.groupingBy(
                analysis -> analysis.getStartedAt().toLocalDate(),
                TreeMap::new,
                Collectors.mapping(
                    analysis -> toConversationAnalysisCardResponse(
                        analysis,
                        conversationKeywordsByAnalysisId.getOrDefault(analysis.getId().getId(), List.of())
                    ),
                    Collectors.toList()
                )
            ));

        TreeSet<LocalDate> dates = new TreeSet<>();
        dates.addAll(diaryListByDate.keySet());
        dates.addAll(conversationListByDate.keySet());

        String summary = recentTrendRepository.findLatestByUserId(childId)
            .map(recentTrend -> recentTrend.getSummary())
            .orElse(null);
        EmotionFlowResponse chart = EmotionFlowResponse.builder()
            .diaryList(diaryAnalyses.stream()
                .map(this::toDiaryChartPointResponse)
                .toList())
            .conversationList(conversationAnalyses.stream()
                .map(this::toConversationChartPointResponse)
                .toList())
            .build();

        return AnalysisContentResponse.builder()
            .summary(summary)
            .chart(chart)
            .dailyGroups(dates.stream()
                .map(date -> AnalysisDailyGroupResponse.builder()
                    .date(date)
                    .diaryList(diaryListByDate.getOrDefault(date, List.of()))
                    .conversationList(conversationListByDate.getOrDefault(date, List.of()))
                    .build())
                .toList())
            .build();
    }

    public DiaryContentResponse getDiaryAnalysisContent(
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

        List<DiaryDailyGroupResponse> dailyGroups = analyses.stream()
            .collect(Collectors.groupingBy(
                analysis -> analysis.getTargetDate().toLocalDate(),
                TreeMap::new,
                Collectors.toList()
            ))
            .entrySet()
            .stream()
            .map(entry -> DiaryDailyGroupResponse.builder()
                .date(entry.getKey())
                .diaryList(entry.getValue().stream()
                    .map(analysis -> toDiaryAnalysisCardResponse(
                        analysis,
                        keywordsByAnalysisId.getOrDefault(analysis.getId().getId(), List.of())
                    ))
                    .toList())
                .build())
            .toList();

        return DiaryContentResponse.builder()
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

    public ConversationContentResponse getConversationAnalysisContent(
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

        List<ConversationDailyGroupResponse> dailyGroups = analyses.stream()
            .collect(Collectors.groupingBy(
                analysis -> analysis.getStartedAt().toLocalDate(),
                TreeMap::new,
                Collectors.toList()
            ))
            .entrySet()
            .stream()
            .map(entry -> ConversationDailyGroupResponse.builder()
                .date(entry.getKey())
                .conversationList(entry.getValue().stream()
                    .map(analysis -> toConversationAnalysisCardResponse(
                        analysis,
                        keywordsByAnalysisId.getOrDefault(analysis.getId().getId(), List.of())
                    ))
                    .toList())
                .build())
            .toList();

        return ConversationContentResponse.builder()
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
        String normalizedType = type == null ? "ALL" : type.toUpperCase();
        if (!"ALL".equals(normalizedType)
            && !"DIARY".equals(normalizedType)
            && !"CONVERSATION".equals(normalizedType)) {
            throw new CustomException("지원하지 않는 분석 타입입니다.", ErrorCode.INVALID_PARAMETER);
        }

        return normalizedType;
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

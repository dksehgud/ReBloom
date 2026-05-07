package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDate;
import java.util.List;

import lombok.Builder;

@Builder
public record AnalysisDailyGroupResponse(
    LocalDate date,
    String dayOfWeek,
    List<DiaryAnalysisCardResponse> diaryCards,
    List<ConversationAnalysisCardResponse> conversationCards
) {
}

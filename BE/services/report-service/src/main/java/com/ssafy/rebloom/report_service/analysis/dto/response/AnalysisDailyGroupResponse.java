package com.ssafy.rebloom.report_service.analysis.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record AnalysisDailyGroupResponse(
        LocalDate date,
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        List<DiaryAnalysisCardResponse> diaryList,
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        List<ConversationAnalysisCardResponse> conversationList
) {
}

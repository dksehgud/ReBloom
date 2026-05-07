package com.ssafy.rebloom.report_service.analysis.dto.response;

import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record ConversationDailyGroupResponse(
        LocalDate date,
        List<ConversationAnalysisCardResponse> conversationList
) {
}

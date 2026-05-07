package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.util.List;
import lombok.Builder;

@Builder
public record EmotionFlowResponse(
    List<DiaryChartPointResponse> diaryList,
    List<ConversationChartPointResponse> conversationList
) {
}

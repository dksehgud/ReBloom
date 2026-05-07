package com.ssafy.rebloom.report_service.analysis.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record AnalysisContentResponse(
        String summary,
        EmotionFlowResponse chart,
        List<AnalysisDailyGroupResponse> dailyGroups
) {
}

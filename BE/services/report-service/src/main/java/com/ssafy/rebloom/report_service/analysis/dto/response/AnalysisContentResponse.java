package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.util.List;

import lombok.Builder;

@Builder
public record AnalysisContentResponse(
    List<AnalysisDailyGroupResponse> dailyGroups
) {
}

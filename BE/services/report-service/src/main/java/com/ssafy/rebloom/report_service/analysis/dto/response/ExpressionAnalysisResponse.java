package com.ssafy.rebloom.report_service.analysis.dto.response;

import lombok.Builder;

@Builder
public record ExpressionAnalysisResponse(
    String summary
) {
}

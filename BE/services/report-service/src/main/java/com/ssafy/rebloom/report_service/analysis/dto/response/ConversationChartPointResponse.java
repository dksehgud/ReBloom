package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record ConversationChartPointResponse(
    LocalDateTime startedAt,
    LocalDateTime endedAt,
    String prediction
) {
}

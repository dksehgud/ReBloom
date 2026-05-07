package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record DiaryChartPointResponse(
    LocalDateTime targetDate,
    String emotionIcon,
    String prediction
) {
}

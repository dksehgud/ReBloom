package com.ssafy.rebloom.report_service.report.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record DiaryEmotionPointResponseDto(
    LocalDateTime targetDate,
    String emotionIcon
) {
}

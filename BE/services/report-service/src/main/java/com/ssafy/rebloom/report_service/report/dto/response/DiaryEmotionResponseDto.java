package com.ssafy.rebloom.report_service.report.dto.response;

import java.util.List;
import lombok.Builder;

@Builder
public record DiaryEmotionResponseDto(
    List<DiaryEmotionPointResponseDto> emotionList
) {
}

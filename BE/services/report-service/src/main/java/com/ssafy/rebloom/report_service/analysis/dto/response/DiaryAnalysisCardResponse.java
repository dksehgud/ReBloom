package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.Builder;

@Builder
public record DiaryAnalysisCardResponse(
    UUID analysisId,
    LocalDateTime targetDate,
    String emotionIcon,
    String embeddingText,
    String prediction,
    List<String> keywords
) {
}

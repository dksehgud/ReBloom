package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.Builder;

@Builder
public record ConversationAnalysisCardResponse(
    UUID analysisId,
    LocalDateTime startedAt,
    LocalDateTime endedAt,
    String embeddingText,
    String prediction,
    boolean aiInitiated,
    List<String> keywords
) {
}

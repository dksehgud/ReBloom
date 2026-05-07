package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDate;

import lombok.Builder;

@Builder
public record DepressionScorePointResponse(
    LocalDate date,
    String label,
    String diaryPrediction,
    String conversationPrediction,
    String averagePrediction
) {
}

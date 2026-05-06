package com.ssafy.rebloom.report_service.analysis.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record DiaryAnalysisInferenceRequestDto(

    @NotNull
    @JsonProperty("diary_id")
    UUID diaryId,

    @NotNull
    @JsonProperty("user_id")
    UUID userId,

    @NotNull
    @JsonProperty("target_date")
    LocalDate targetDate,

    @NotBlank
    String content
) {
}

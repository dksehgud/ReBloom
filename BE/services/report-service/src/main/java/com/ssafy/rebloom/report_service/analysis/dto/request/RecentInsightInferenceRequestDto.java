package com.ssafy.rebloom.report_service.analysis.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record RecentInsightInferenceRequestDto(

    @NotNull
    @JsonProperty("user_id")
    UUID userId,

    @NotNull
    @JsonProperty("start_date")
    LocalDate startDate,

    @NotNull
    @JsonProperty("end_date")
    LocalDate endDate
) {
}

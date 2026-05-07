package com.ssafy.rebloom.report_service.report.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record ChildrenReportCreateRequestDto(
    @NotBlank String emotionTag,
    @NotBlank String context,
    @NotNull LocalDateTime reportDate
) {
}

package com.ssafy.rebloom.report_service.report.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record ChildrenReportUpdateRequestDto(
    @NotBlank String emotionTag,
    @NotBlank @Size(max = 500) String context,
    @NotNull LocalDateTime reportDate
) {
}

package com.ssafy.rebloom.report_service.report.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CounselorCommentCreateRequestDto(
    @NotBlank @Size(max = 300) String context
) {
}

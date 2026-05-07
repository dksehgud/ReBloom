package com.ssafy.rebloom.report_service.report.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CounselorCommentCreateRequestDto(
    @NotBlank String context
) {
}

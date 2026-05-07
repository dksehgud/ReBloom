package com.ssafy.rebloom.report_service.report.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;

@Builder
public record CounselorCommentResponseDto(
    UUID commentId,
    UUID counselorId,
    UUID reportId,
    String context,
    LocalDateTime createdAt
) {
}

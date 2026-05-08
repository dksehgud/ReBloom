package com.ssafy.rebloom.report_service.report.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;

@Builder
public record ChildrenReportResponseDto(
    UUID reportId,
    UUID childrenId,
    UUID parentId,
    String emotionTag,
    String context,
    LocalDateTime reportDate,
    boolean hasCounselorComment
) {
}

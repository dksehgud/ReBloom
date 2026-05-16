package com.ssafy.rebloom.report_service.analysis.dto.request;

import java.time.LocalDateTime;
import java.util.UUID;

public record ParentReportCreatedLocalEvent(
    UUID reportId,
    UUID childrenId,
    UUID parentId,
    LocalDateTime reportDate,
    LocalDateTime createdAt
) {
}
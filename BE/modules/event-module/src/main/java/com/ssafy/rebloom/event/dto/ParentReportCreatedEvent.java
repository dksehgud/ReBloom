package com.ssafy.rebloom.event.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ParentReportCreatedEvent(
    UUID reportId,
    UUID childrenId,
    UUID parentId,
    LocalDateTime reportDate,
    LocalDateTime createdAt
) {
}
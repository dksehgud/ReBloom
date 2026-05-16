package com.ssafy.rebloom.event.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ParentReportCommentCreatedEvent(
    UUID commentId,
    UUID reportId,
    UUID childrenId,
    UUID parentId,
    UUID counselorId,
    LocalDateTime createdAt
) {
}
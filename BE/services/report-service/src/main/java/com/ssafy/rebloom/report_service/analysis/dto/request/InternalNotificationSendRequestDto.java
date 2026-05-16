package com.ssafy.rebloom.report_service.analysis.dto.request;

import java.util.UUID;

public record InternalNotificationSendRequestDto(
    UUID receiverId,
    String receiverRole,
    String notificationCode,
    String title,
    String content,
    UUID childrenId,
    String childrenName,
    UUID childrenReportId,
    UUID parentId,
    UUID counselorId,
    String counselorName
) {
}
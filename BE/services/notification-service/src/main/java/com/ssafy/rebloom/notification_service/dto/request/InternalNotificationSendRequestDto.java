package com.ssafy.rebloom.notification_service.dto.request;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record InternalNotificationSendRequestDto(
    @NotNull UUID receiverId,
    @NotNull ReceiverRole receiverRole,
    @NotNull NotificationCode notificationCode,
    @NotBlank String title,
    @NotBlank String content,
    UUID childrenId,
    String childrenName,
    UUID childrenReportId,
    UUID parentId,
    UUID counselorId,
    String counselorName
) {

    public NotificationPayload toPayload() {
        return NotificationPayload.builder()
            .title(title)
            .content(content)
            .childrenId(childrenId)
            .childrenName(childrenName)
            .childrenReportId(childrenReportId)
            .parentId(parentId)
            .counselorId(counselorId)
            .counselorName(counselorName)
            .build();
    }
}
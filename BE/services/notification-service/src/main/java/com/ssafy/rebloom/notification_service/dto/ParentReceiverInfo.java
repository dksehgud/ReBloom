package com.ssafy.rebloom.notification_service.dto;

import java.util.UUID;

public record ParentReceiverInfo(
    UUID parentId,
    UUID childrenId,
    String childrenName
) {
}
package com.ssafy.rebloom.notification_service.dto.response;

import java.util.UUID;

public record ParentReceiverResponseDto(
    boolean connected,
    UUID parentId,
    UUID childrenId,
    String childrenName
) {

}

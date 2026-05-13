package com.ssafy.rebloom.notification_service.dto.response;

import java.util.UUID;

public record ChildrenIotInfoResponseDto(
    UUID childrenId,
    String serialNumber
) {
}

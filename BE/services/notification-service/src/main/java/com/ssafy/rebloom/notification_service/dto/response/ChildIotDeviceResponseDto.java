package com.ssafy.rebloom.notification_service.dto.response;

import java.util.UUID;

public record ChildIotDeviceResponseDto(
    UUID childrenId,
    String deviceType,
    String serialNumber
) {
}

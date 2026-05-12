package com.ssafy.rebloom.auth_service.device.dto.response;

import com.ssafy.rebloom.auth_service.device.domain.entity.Device;
import com.ssafy.rebloom.auth_service.device.domain.enums.DeviceType;
import java.util.UUID;

public record DeviceResponseDto(
    Long deviceId,
    String serialNumber,
    DeviceType deviceType,
    UUID childrenId
) {

    public static DeviceResponseDto from(Device device) {
        return new DeviceResponseDto(
            device.getId(),
            device.getSerialNumber(),
            device.getDeviceType(),
            device.getChildrenId()
        );
    }
}

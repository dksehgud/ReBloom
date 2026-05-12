package com.ssafy.rebloom.auth_service.device.dto.request;

import com.ssafy.rebloom.auth_service.device.domain.enums.DeviceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeviceRegisterRequestDto(
    @NotBlank
    String serialNumber,

    @NotNull
    DeviceType deviceType
) {
}

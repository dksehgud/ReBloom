package com.ssafy.rebloom.auth_service.device.service;

import com.ssafy.rebloom.auth_service.device.domain.enums.DeviceType;
import com.ssafy.rebloom.auth_service.device.dto.request.DeviceRegisterRequestDto;
import com.ssafy.rebloom.auth_service.device.dto.response.DeviceResponseDto;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import java.util.UUID;

public interface DeviceService {

    DeviceResponseDto registerDevice(UUID parentId, UUID childrenId, DeviceRegisterRequestDto request);

    DeviceResponseDto registerDeviceByChild(UUID childrenId, DeviceRegisterRequestDto request);

    DeviceResponseDto getDeviceByParent(UUID parentId, UUID childrenId, DeviceType deviceType);

    DeviceResponseDto getMyDevice(UUID childrenId, DeviceType deviceType);

    void deleteDevice(UUID parentId, UUID childrenId, String serialNumber);

    void deleteDeviceByChild(UUID childrenId, String serialNumber);

    ListResponseDto<DeviceResponseDto> getDevicesByParent(UUID parentId, UUID childrenId);

    ListResponseDto<DeviceResponseDto> getMyDevices(UUID childrenId);
}

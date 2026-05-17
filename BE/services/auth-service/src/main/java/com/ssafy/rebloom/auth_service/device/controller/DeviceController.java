package com.ssafy.rebloom.auth_service.device.controller;

import com.ssafy.rebloom.auth_service.device.domain.enums.DeviceType;
import com.ssafy.rebloom.auth_service.device.dto.request.DeviceRegisterRequestDto;
import com.ssafy.rebloom.auth_service.device.dto.response.DeviceResponseDto;
import com.ssafy.rebloom.auth_service.device.service.DeviceService;
import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class DeviceController {

    private final DeviceService deviceService;

    @GetMapping("/children/devices")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<ListResponseDto<DeviceResponseDto>>> getChildrenDevices(
        @LoginUserId UUID childrenId
    ) {
        ListResponseDto<DeviceResponseDto> response = deviceService.getMyDevices(childrenId);
        return ResponseEntity.ok(BaseResponse.success("기기 조회 성공", response));
    }

    @PostMapping("/children/devices")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<DeviceResponseDto>> registerChildrenDevice(
        @LoginUserId UUID childrenId,
        @RequestBody @Valid DeviceRegisterRequestDto request
    ) {
        DeviceResponseDto response = deviceService.registerDeviceByChild(childrenId, request);
        return ResponseEntity.ok(BaseResponse.success("기기 등록 성공", response));
    }

    @GetMapping("/children/devices/type/{deviceType}")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<DeviceResponseDto>> getChildrenDeviceByType(
        @LoginUserId UUID childrenId,
        @PathVariable DeviceType deviceType
    ) {
        DeviceResponseDto response = deviceService.getMyDevice(childrenId, deviceType);
        return ResponseEntity.ok(BaseResponse.success("기기 조회 성공", response));
    }

    @DeleteMapping("/children/devices/serial/{serialNumber}")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<Void>> deleteChildrenDevice(
        @LoginUserId UUID childrenId,
        @PathVariable String serialNumber
    ) {
        deviceService.deleteDeviceByChild(childrenId, serialNumber);
        return ResponseEntity.ok(BaseResponse.success("기기 삭제 성공"));
    }

    @GetMapping({
        "/parents/devices/{childrenId}",
        "/parents/devices/{childrenId}/",
        "/parents/children/{childrenId}/device"
    })
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<ListResponseDto<DeviceResponseDto>>> getDevicesByParent(
        @LoginUserId UUID parentId,
        @PathVariable UUID childrenId
    ) {
        ListResponseDto<DeviceResponseDto> response = deviceService.getDevicesByParent(parentId, childrenId);
        return ResponseEntity.ok(BaseResponse.success("기기 조회 성공", response));
    }

    @PostMapping({
        "/parents/devices/{childrenId}",
        "/parents/device/{childrenId}"
    })
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<DeviceResponseDto>> registerDevice(
        @LoginUserId UUID parentId,
        @PathVariable UUID childrenId,
        @RequestBody @Valid DeviceRegisterRequestDto request
    ) {
        DeviceResponseDto response = deviceService.registerDevice(parentId, childrenId, request);
        return ResponseEntity.ok(BaseResponse.success("기기 등록 성공", response));
    }

    @GetMapping({
        "/parents/devices/{childrenId}/type/{deviceType}",
        "/parents/devices/{childrenId}/type/{deviceType}/",
        "/parents/devices/{childrenId}/types/{deviceType}",
        "/parents/devices/{childrenId}/types/{deviceType}/"
    })
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<DeviceResponseDto>> getDeviceByParentAndType(
        @LoginUserId UUID parentId,
        @PathVariable UUID childrenId,
        @PathVariable DeviceType deviceType
    ) {
        DeviceResponseDto response = deviceService.getDeviceByParent(parentId, childrenId, deviceType);
        return ResponseEntity.ok(BaseResponse.success("기기 조회 성공", response));
    }

    @DeleteMapping({
        "/parents/devices/{childrenId}/serial/{serialNumber}",
        "/parents/children/{childrenId}/devices/serial/{serialNumber}"
    })
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<Void>> deleteDevice(
        @LoginUserId UUID parentId,
        @PathVariable UUID childrenId,
        @PathVariable String serialNumber
    ) {
        deviceService.deleteDevice(parentId, childrenId, serialNumber);
        return ResponseEntity.ok(BaseResponse.success("기기 삭제 성공"));
    }

    @GetMapping("/internal/devices/serial/{serialNumber}/children-id")
    public ResponseEntity<BaseResponse<UUID>> getChildrenIdByDeviceSerial(
        @PathVariable String serialNumber
    ) {
        UUID childrenId = deviceService.getChildrenIdBySerialNumber(serialNumber);
        return ResponseEntity.ok(BaseResponse.success("기기 아동 ID 조회 성공", childrenId));
    }
    
}

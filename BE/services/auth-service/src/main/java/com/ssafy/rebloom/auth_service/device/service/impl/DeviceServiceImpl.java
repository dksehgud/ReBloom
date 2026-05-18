package com.ssafy.rebloom.auth_service.device.service.impl;

import com.ssafy.rebloom.auth_service.device.domain.entity.Device;
import com.ssafy.rebloom.auth_service.device.domain.enums.DeviceType;
import com.ssafy.rebloom.auth_service.device.dto.request.DeviceRegisterRequestDto;
import com.ssafy.rebloom.auth_service.device.dto.response.DeviceResponseDto;
import com.ssafy.rebloom.auth_service.device.repository.DeviceRepository;
import com.ssafy.rebloom.auth_service.device.service.DeviceService;
import com.ssafy.rebloom.auth_service.user.repository.ChildrenParentRelationRepository;
import com.ssafy.rebloom.auth_service.user.repository.ChildrenRepository;
import com.ssafy.rebloom.auth_service.user.repository.ParentRepository;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeviceServiceImpl implements DeviceService {

    private final DeviceRepository deviceRepository;
    private final ParentRepository parentRepository;
    private final ChildrenRepository childrenRepository;
    private final ChildrenParentRelationRepository childrenParentRelationRepository;

    @Override
    @Transactional
    public DeviceResponseDto registerDevice(
        UUID parentId,
        UUID childrenId,
        DeviceRegisterRequestDto request
    ) {
        validateParentExists(parentId);
        validateChildExists(childrenId);
        validateParentChildRelation(parentId, childrenId);

        return registerDeviceForChild(childrenId, request, true);
    }

    @Override
    @Transactional
    public DeviceResponseDto registerDeviceByChild(UUID childrenId, DeviceRegisterRequestDto request) {
        validateChildExists(childrenId);
        return registerDeviceForChild(childrenId, request, false);
    }

    @Override
    public DeviceResponseDto getDeviceByParent(UUID parentId, UUID childrenId, DeviceType deviceType) {
        validateParentExists(parentId);
        validateChildExists(childrenId);
        validateParentChildRelation(parentId, childrenId);
        return DeviceResponseDto.from(getDeviceByChildrenIdAndType(childrenId, deviceType));
    }

    @Override
    public DeviceResponseDto getMyDevice(UUID childrenId, DeviceType deviceType) {
        validateChildExists(childrenId);
        return DeviceResponseDto.from(getDeviceByChildrenIdAndType(childrenId, deviceType));
    }

    @Override
    @Transactional
    public void deleteDevice(UUID parentId, UUID childrenId, String serialNumber) {
        validateParentExists(parentId);
        validateChildExists(childrenId);
        validateParentChildRelation(parentId, childrenId);

        Device device = getDeviceBySerialNumber(serialNumber);
        validateDeviceOwnership(childrenId, device);
        deviceRepository.delete(device);
    }

    @Override
    @Transactional
    public void deleteDeviceByChild(UUID childrenId, String serialNumber) {
        validateChildExists(childrenId);

        Device device = getDeviceBySerialNumber(serialNumber);
        validateDeviceOwnership(childrenId, device);
        deviceRepository.delete(device);
    }

    @Override
    public ListResponseDto<DeviceResponseDto> getDevicesByParent(UUID parentId, UUID childrenId) {
        validateParentExists(parentId);
        validateChildExists(childrenId);
        validateParentChildRelation(parentId, childrenId);

        return getDevicesByChildrenId(childrenId);
    }

    @Override
    public ListResponseDto<DeviceResponseDto> getMyDevices(UUID childrenId) {
        validateChildExists(childrenId);
        return getDevicesByChildrenId(childrenId);
    }

    @Override
    public UUID getChildrenIdBySerialNumber(String serialNumber) {
        return getDeviceBySerialNumber(serialNumber).getChildrenId();
    }

    private void validateParentChildRelation(UUID parentId, UUID childrenId) {
        boolean hasActiveRelation = childrenParentRelationRepository.existsActiveRelation(
            parentId,
            childrenId
        );

        if (!hasActiveRelation) {
            throw new CustomException(
                "부모가 해당 아이에게 기기를 등록할 권한이 없습니다.",
                ErrorCode.FORBIDDEN
            );
        }
    }

    private DeviceResponseDto registerDeviceForChild(
        UUID childrenId,
        DeviceRegisterRequestDto request,
        boolean allowReassignment
    ) {
        String serialNumber = request.serialNumber().trim();
        Device existingDevice = deviceRepository.findBySerialNumber(serialNumber)
            .orElse(null);

        if (existingDevice != null && allowReassignment) {
            return DeviceResponseDto.from(reassignExistingDevice(childrenId, request, existingDevice));
        }
        if (deviceRepository.existsBySerialNumber(serialNumber)) {
            throw new CustomException("이미 등록된 기기입니다.", ErrorCode.DUPLICATE_RESOURCE);
        }
        if (deviceRepository.existsByChildrenIdAndDeviceType(childrenId, request.deviceType())) {
            throw new CustomException("이미 해당 타입의 기기가 등록되어 있습니다.", ErrorCode.DUPLICATE_RESOURCE);
        }

        Device device = Device.builder()
            .serialNumber(serialNumber)
            .deviceType(request.deviceType())
            .childrenId(childrenId)
            .build();

        return DeviceResponseDto.from(deviceRepository.save(device));
    }

    private Device reassignExistingDevice(
        UUID childrenId,
        DeviceRegisterRequestDto request,
        Device existingDevice
    ) {
        if (existingDevice.getDeviceType() != request.deviceType()) {
            throw new CustomException(
                "기기 시리얼 번호와 타입이 일치하지 않습니다.",
                ErrorCode.BAD_REQUEST
            );
        }

        if (existingDevice.getChildrenId().equals(childrenId)) {
            return existingDevice;
        }

        deviceRepository.findByChildrenIdAndDeviceType(childrenId, existingDevice.getDeviceType())
            .ifPresent(deviceForTargetChild -> {
                deviceRepository.delete(deviceForTargetChild);
                deviceRepository.flush();
            });

        existingDevice.assignToChild(childrenId);

        return existingDevice;
    }

    private void validateDeviceOwnership(UUID childrenId, Device device) {
        if (!device.getChildrenId().equals(childrenId)) {
            throw new CustomException("해당 기기에 접근할 권한이 없습니다.", ErrorCode.FORBIDDEN);
        }
    }

    private ListResponseDto<DeviceResponseDto> getDevicesByChildrenId(UUID childrenId) {
        return ListResponseDto.from(
            deviceRepository.findAllByChildrenId(childrenId)
                .stream()
                .map(DeviceResponseDto::from)
                .toList()
        );
    }

    private Device getDeviceByChildrenIdAndType(UUID childrenId, DeviceType deviceType) {
        return deviceRepository.findByChildrenIdAndDeviceType(childrenId, deviceType)
            .orElseThrow(() -> new CustomException("기기를 찾을 수 없습니다.", ErrorCode.NOT_FOUND));
    }

    private Device getDeviceBySerialNumber(String serialNumber) {
        return deviceRepository.findBySerialNumber(serialNumber.trim())
            .orElseThrow(() -> new CustomException("기기를 찾을 수 없습니다.", ErrorCode.NOT_FOUND));
    }

    private void validateParentExists(UUID parentId) {
        if (!parentRepository.existsById(parentId)) {
            throw new CustomException("부모를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND);
        }
    }

    private void validateChildExists(UUID childrenId) {
        if (!childrenRepository.existsById(childrenId)) {
            throw new CustomException("아이를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND);
        }
    }
}

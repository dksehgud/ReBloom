package com.ssafy.rebloom.auth_service.user.service.impl;

import com.ssafy.rebloom.auth_service.device.domain.entity.Device;
import com.ssafy.rebloom.auth_service.device.domain.enums.DeviceType;
import com.ssafy.rebloom.auth_service.device.repository.DeviceRepository;
import com.ssafy.rebloom.auth_service.user.domain.entity.Children;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildGpsResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
import com.ssafy.rebloom.auth_service.user.service.InternalUserService;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InternalUserServiceImpl implements InternalUserService {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;

    @Override
    public ChildGpsResponseDto getChildGpsInfo(UUID childId) {
        User user = userRepository.findById(childId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Children children)) {
            throw new CustomException("아동 사용자가 아닙니다.", ErrorCode.INVALID_PARAMETER);
        }

        return new ChildGpsResponseDto(
            children.getId(),
            children.getLatitude() == null ? null : children.getLatitude().setScale(10, java.math.RoundingMode.HALF_UP),
            children.getLongitude() == null ? null : children.getLongitude().setScale(10, java.math.RoundingMode.HALF_UP));
    }

    @Override
    public ChildrenIotInfoResponseDto getChildrenIotInfo(UUID childrenId) {
        Children children = getChildren(childrenId);

        Device device = deviceRepository.findByChildrenIdAndDeviceType(
                childrenId,
                DeviceType.IOT
            )
            .orElseThrow(() -> new CustomException(
                "자녀 IOT 디바이스를 찾을 수 없습니다.",
                ErrorCode.NOT_FOUND
            ));

        return new ChildrenIotInfoResponseDto(
            children.getId(),
            device.getSerialNumber()
        );
    }

    private Children getChildren(UUID childId) {
        User user = userRepository.findById(childId)
            .orElseThrow(() -> new CustomException(
                "사용자를 찾을 수 없습니다.",
                ErrorCode.USER_NOT_FOUND
            ));

        if (!(user instanceof Children children)) {
            throw new CustomException(
                "아동 사용자가 아닙니다.",
                ErrorCode.USER_ROLE_TYPE_MISMATCH
            );
        }

        return children;
    }
}

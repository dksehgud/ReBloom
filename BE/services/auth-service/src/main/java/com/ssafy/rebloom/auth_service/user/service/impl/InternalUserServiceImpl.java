package com.ssafy.rebloom.auth_service.user.service.impl;

import com.ssafy.rebloom.auth_service.device.domain.entity.Device;
import com.ssafy.rebloom.auth_service.device.domain.enums.DeviceType;
import com.ssafy.rebloom.auth_service.device.repository.DeviceRepository;
import com.ssafy.rebloom.auth_service.user.domain.entity.Children;
import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenCounselorRelation;
import com.ssafy.rebloom.auth_service.user.domain.entity.Counselor;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildAgeResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildConnectedCounselorResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildGpsResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.auth_service.user.repository.ChildrenCounselorRelationRepository;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
import com.ssafy.rebloom.auth_service.user.service.InternalUserService;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InternalUserServiceImpl implements InternalUserService {

    private static final DateTimeFormatter BIRTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DeviceType CHILD_IOT_DEVICE_TYPE = DeviceType.IOT;

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;

    private final ChildrenCounselorRelationRepository childrenCounselorRelationRepository;

    @Override
    public ChildGpsResponseDto getChildGpsInfo(UUID childId) {
        Children children = getChildren(childId);

        if (children.getLatitude() == null || children.getLongitude() == null) {
            throw new CustomException(
                "Target location is not configured.",
                ErrorCode.TARGET_LOCATION_NOT_CONFIGURED
            );
        }

        Device device = deviceRepository.findByChildrenIdAndDeviceType(
                childId,
                CHILD_IOT_DEVICE_TYPE
            )
            .orElseThrow(() -> new CustomException(
                "Child IOT device not found.",
                ErrorCode.NOT_FOUND
            ));

        return new ChildGpsResponseDto(
            children.getId(),
            children.getLatitude().setScale(10, java.math.RoundingMode.HALF_UP),
            children.getLongitude().setScale(10, java.math.RoundingMode.HALF_UP),
            device.getSerialNumber()
        );
    }

    @Override
    public ChildAgeResponseDto getChildAge(UUID childId) {
        Children children = getChildren(childId);
        LocalDate birth = LocalDate.parse(children.getBirth(), BIRTH_FORMATTER);
        return new ChildAgeResponseDto(Period.between(birth, LocalDate.now()).getYears());
    }

    private Children getChildren(UUID childId) {
        User user = userRepository.findById(childId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Children children)) {
            throw new CustomException("아동 사용자가 아닙니다.", ErrorCode.INVALID_PARAMETER);
        }

        return children;
    }

    @Override
    public ChildrenIotInfoResponseDto getChildrenIotInfo(UUID childrenId) {
        Children children = getChildren(childrenId);

        Device device = deviceRepository.findByChildrenIdAndDeviceType(
                childrenId,
                CHILD_IOT_DEVICE_TYPE
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

    @Override
    public ChildConnectedCounselorResponseDto getConnectedCounselorByChild(UUID childrenId) {
        return childrenCounselorRelationRepository
            .findFirstByChildren_IdAndRelationStatus(childrenId, RelationStatus.ACTIVE)
            .map(this::toChildConnectedCounselorResponse)
            .orElseGet(ChildConnectedCounselorResponseDto::disconnected);
    }

    private ChildConnectedCounselorResponseDto toChildConnectedCounselorResponse(
        ChildrenCounselorRelation relation
    ) {
        Counselor counselor = relation.getCounselor();
        return new ChildConnectedCounselorResponseDto(
            true,
            counselor.getId(),
            counselor.getName(),
            counselor.getEmail(),
            counselor.getHospitalName()
        );
    }
}

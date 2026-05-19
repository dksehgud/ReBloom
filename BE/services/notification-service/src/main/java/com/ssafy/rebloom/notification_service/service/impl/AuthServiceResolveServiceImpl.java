package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.notification_service.client.AuthServiceInternalClient;
import com.ssafy.rebloom.notification_service.dto.CounselorReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.notification_service.dto.response.CounselorReceiverResponseDto;
import com.ssafy.rebloom.notification_service.dto.response.ParentReceiverResponseDto;
import com.ssafy.rebloom.notification_service.service.AuthServiceResolveService;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceResolveServiceImpl implements AuthServiceResolveService {

    private final AuthServiceInternalClient authServiceInternalClient;

    @Override
    public ParentReceiverInfo resolveParentByChildrenId(UUID childrenId) {
        BaseResponse<ParentReceiverResponseDto> response =
            authServiceInternalClient.getParentReceiver(childrenId);

        ParentReceiverResponseDto data = response.getData();

        if (data == null || !data.connected()) {
            throw new CustomException(
                "부모님과의 관계를 찾을 수 없습니다.",
                ErrorCode.PARENT_RELATION_NOT_FOUND
            );
        }

        return new ParentReceiverInfo(
            data.parentId(),
            data.childrenId(),
            data.childrenName()
        );
    }

    @Override
    public ChildrenIotInfoResponseDto resolveChildrenIotInfo(UUID childrenId) {
        BaseResponse<ChildrenIotInfoResponseDto> response =
            authServiceInternalClient.getChildrenIotInfo(childrenId);

        ChildrenIotInfoResponseDto childrenIotInfoResponseDto = response.getData();

        if (childrenIotInfoResponseDto == null
            || childrenIotInfoResponseDto.serialNumber() == null
            || childrenIotInfoResponseDto.serialNumber().isBlank()) {
            throw new CustomException(
                "자녀 AIoT 정보를 찾을 수 없습니다.",
                ErrorCode.NOT_FOUND
            );
        }

        return childrenIotInfoResponseDto;
    }

    @Override
    public UUID resolveChildrenIdByDeviceSerial(String serialNumber) {
        BaseResponse<UUID> response =
            authServiceInternalClient.getChildrenIdByDeviceSerial(serialNumber);

        UUID childrenId = response.getData();
        if (childrenId == null) {
            throw new CustomException(
                "기기에 연결된 자녀를 찾을 수 없습니다.",
                ErrorCode.NOT_FOUND
            );
        }

        return childrenId;
    }

    @Override
    public Optional<CounselorReceiverInfo> resolveCounselorByChildrenId(UUID childrenId) {
        BaseResponse<CounselorReceiverResponseDto> response =
            authServiceInternalClient.getCounselorReceiver(childrenId);

        CounselorReceiverResponseDto data = response.getData();

        if (data == null || !data.connected() || data.counselorId() == null) {
            return Optional.empty();
        }

        return Optional.of(new CounselorReceiverInfo(
            data.counselorId(),
            data.name()
        ));
    }
}
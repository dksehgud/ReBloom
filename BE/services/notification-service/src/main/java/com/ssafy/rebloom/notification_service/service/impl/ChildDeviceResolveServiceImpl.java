package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.notification_service.client.AuthServiceInternalClient;
import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.notification_service.service.ChildDeviceResolveService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChildDeviceResolveServiceImpl implements ChildDeviceResolveService {

    private final AuthServiceInternalClient authServiceInternalClient;

    @Override
    public ChildrenIotInfoResponseDto resolveIotDeviceByChildrenId(UUID childrenId) {
        BaseResponse<ChildrenIotInfoResponseDto> response =
            authServiceInternalClient.getChildIotDevice(childrenId);
        return response.getData();
    }
}

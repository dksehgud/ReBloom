package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.notification_service.client.AuthServiceInternalClient;
import com.ssafy.rebloom.notification_service.dto.response.ChildIotDeviceResponseDto;
import com.ssafy.rebloom.notification_service.service.ChildDeviceResolveService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChildDeviceResolveServiceImpl implements ChildDeviceResolveService {

    private final AuthServiceInternalClient authServiceInternalClient;

    @Override
    public ChildIotDeviceResponseDto resolveIotDeviceByChildrenId(UUID childrenId) {
        BaseResponse<ChildIotDeviceResponseDto> response =
            authServiceInternalClient.getChildIotDevice(childrenId);
        return response.getData();
    }
}

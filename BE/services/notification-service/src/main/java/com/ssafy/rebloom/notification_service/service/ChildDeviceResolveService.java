package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.response.ChildIotDeviceResponseDto;
import java.util.UUID;

public interface ChildDeviceResolveService {
    ChildIotDeviceResponseDto resolveIotDeviceByChildrenId(UUID childrenId);
}

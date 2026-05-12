package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;
import java.util.UUID;

public interface ChildDeviceResolveService {
    ChildrenIotInfoResponseDto resolveIotDeviceByChildrenId(UUID childrenId);
}

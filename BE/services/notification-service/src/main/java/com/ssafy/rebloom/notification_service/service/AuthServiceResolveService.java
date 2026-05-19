package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.CounselorReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;
import java.util.Optional;
import java.util.UUID;

public interface AuthServiceResolveService {

    ParentReceiverInfo resolveParentByChildrenId(UUID childrenId);

    ChildrenIotInfoResponseDto resolveChildrenIotInfo(UUID childrenId);

    UUID resolveChildrenIdByDeviceSerial(String serialNumber);

    Optional<CounselorReceiverInfo> resolveCounselorByChildrenId(UUID childrenId);
}

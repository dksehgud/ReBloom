package com.ssafy.rebloom.report_service.analysis.client;

import com.ssafy.rebloom.common.dto.BaseResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthAccessClient {

    private final InternalAuthClient internalAuthClient;

    public void validateCounselorChildAccess(UUID counselorId, UUID childId) {
        internalAuthClient.validateCounselorChildAccess(counselorId, childId);
    }

    public void validateParentChildAccess(UUID parentId, UUID childId) {
        internalAuthClient.validateParentChildAccess(parentId, childId);
    }

    public UUID getChildrenIdByDeviceSerial(String serialNumber) {
        BaseResponse<UUID> response = internalAuthClient.getChildrenIdByDeviceSerial(serialNumber);
        return response.getData();
    }
}

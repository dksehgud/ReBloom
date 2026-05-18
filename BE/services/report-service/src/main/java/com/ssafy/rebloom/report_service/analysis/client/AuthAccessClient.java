package com.ssafy.rebloom.report_service.analysis.client;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ActiveChildResponseDto;
import java.util.List;
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

    public List<ActiveChildResponseDto> getActiveChildren() {
        BaseResponse<List<ActiveChildResponseDto>> response = internalAuthClient.getActiveChildren();
        return response.getData();
    }
}

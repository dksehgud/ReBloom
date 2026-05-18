package com.ssafy.rebloom.report_service.analysis.client;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ActiveChildResponseDto;
import java.util.List;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service", url = "${rebloom.client.auth-service-url}")
public interface InternalAuthClient {

    @GetMapping("/api/v1/relations/access/counselors/{counselorId}/children/{childrenId}")
    BaseResponse<Void> validateCounselorChildAccess(
        @PathVariable UUID counselorId,
        @PathVariable UUID childrenId
    );

    @GetMapping("/api/v1/relations/access/parents/{parentId}/children/{childrenId}")
    BaseResponse<Void> validateParentChildAccess(
        @PathVariable UUID parentId,
        @PathVariable UUID childrenId
    );

    @GetMapping("/api/v1/internal/devices/serial/{serialNumber}/children-id")
    BaseResponse<UUID> getChildrenIdByDeviceSerial(
        @PathVariable String serialNumber
    );

    @GetMapping("/api/v1/internal/children/active")
    BaseResponse<List<ActiveChildResponseDto>> getActiveChildren();
}

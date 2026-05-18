package com.ssafy.rebloom.notification_service.client;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.notification_service.dto.response.CounselorReceiverResponseDto;
import com.ssafy.rebloom.notification_service.dto.response.ParentReceiverResponseDto;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
    name = "auth-service-internal-client",
    url = "${rebloom.clients.auth-service.url}"
)
public interface AuthServiceInternalClient {

    @GetMapping("/api/v1/internal/children/{childrenId}/parent-receiver")
    BaseResponse<ParentReceiverResponseDto> getParentReceiver(
        @PathVariable UUID childrenId
    );

    @GetMapping("/api/v1/internal/children/{childrenId}/iot-info")
    BaseResponse<ChildrenIotInfoResponseDto> getChildrenIotInfo(
        @PathVariable UUID childrenId
    );

    @GetMapping("/api/v1/internal/children/{childrenId}/counselor-receiver")
    BaseResponse<CounselorReceiverResponseDto> getCounselorReceiver(
        @PathVariable UUID childrenId
    );
}

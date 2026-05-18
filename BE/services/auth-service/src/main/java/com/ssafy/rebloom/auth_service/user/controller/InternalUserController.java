package com.ssafy.rebloom.auth_service.user.controller;

import com.ssafy.rebloom.auth_service.user.dto.response.ActiveChildResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildAgeResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildConnectedCounselorResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildGpsResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ParentReceiverResponseDto;
import com.ssafy.rebloom.auth_service.user.service.InternalUserService;
import com.ssafy.rebloom.common.dto.BaseResponse;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/internal")
public class InternalUserController {

    private final InternalUserService internalUserService;

    @GetMapping("/children/{childId}/target-location")
    public ResponseEntity<BaseResponse<ChildGpsResponseDto>> getChildGpsInfo(
        @PathVariable UUID childId
    ) {
        ChildGpsResponseDto response = internalUserService.getChildGpsInfo(childId);
        return ResponseEntity.ok(BaseResponse.success("아동 GPS 조회 성공", response));
    }

    @GetMapping("/users/{userId}/age")
    public ResponseEntity<BaseResponse<ChildAgeResponseDto>> getChildAge(
        @PathVariable UUID userId
    ) {
        ChildAgeResponseDto response = internalUserService.getChildAge(userId);
        return ResponseEntity.ok(BaseResponse.success("아동 나이 조회 성공", response));
    }

    @GetMapping("/children/{childrenId}/iot-info")
    public ResponseEntity<BaseResponse<ChildrenIotInfoResponseDto>> getChildrenIotInfo(
        @PathVariable UUID childrenId
    ) {
        ChildrenIotInfoResponseDto response =
            internalUserService.getChildrenIotInfo(childrenId);

        return ResponseEntity.ok(
            BaseResponse.success("자녀 AIoT 정보 조회 성공", response)
        );
    }

    @GetMapping("/children/{childrenId}/counselor-receiver")
    public ResponseEntity<BaseResponse<ChildConnectedCounselorResponseDto>> getCounselorReceiver(
        @PathVariable UUID childrenId
    ) {
        ChildConnectedCounselorResponseDto response =
            internalUserService.getConnectedCounselorByChild(childrenId);

        return ResponseEntity.ok(
            BaseResponse.success("상담사 알림 수신자 조회 성공", response)
        );
    }

    @GetMapping("/children/active")
    public ResponseEntity<BaseResponse<List<ActiveChildResponseDto>>> getActiveChildren() {
        List<ActiveChildResponseDto> response = internalUserService.getActiveChildren();
        return ResponseEntity.ok(BaseResponse.success("활동 중인 자녀 조회 성공", response));
    }

    @GetMapping("/children/{childrenId}/parent-receiver")
    public ResponseEntity<BaseResponse<ParentReceiverResponseDto>> getParentReceiver(
        @PathVariable UUID childrenId
    ) {
        ParentReceiverResponseDto response =
            internalUserService.getParentReceiverByChildrenId(childrenId);

        return ResponseEntity.ok(
            BaseResponse.success("자녀의 부모 알림 수신자 조회 성공", response)
        );
    }
}

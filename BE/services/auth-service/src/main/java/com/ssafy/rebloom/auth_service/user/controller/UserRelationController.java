package com.ssafy.rebloom.auth_service.user.controller;

import com.ssafy.rebloom.auth_service.user.dto.request.ParentConnectRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.*;
import com.ssafy.rebloom.auth_service.user.service.UserService;
import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class UserRelationController {

    private final UserService userService;

    @GetMapping("/counselors/children")
    @PreAuthorize("hasRole('COUNSELOR')")
    public ResponseEntity<BaseResponse<CounselorChildrenResponseDto>> getCounselorChildren(
        @LoginUserId UUID counselorId
    ) {
        CounselorChildrenResponseDto response = userService.getCounselorChildren(counselorId);
        return ResponseEntity.ok(BaseResponse.success("상담사 연결 아동 목록 조회 성공", response));
    }

    @GetMapping("/parent/counselor")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<ParentCounselorResponseDto>> getCounselorParent(
        @LoginUserId UUID parentId
    ) {
        ParentCounselorResponseDto response = userService.getParentCounselor(parentId);
        return ResponseEntity.ok(BaseResponse.success("부모 연결 상담사 조회 성공", response));
    }

    @GetMapping("/parents/children")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<ParentConnectedChildResponseDto>> getConnectedChildByParent(
        @LoginUserId UUID parentId
    ) {
        ParentConnectedChildResponseDto response = userService.getConnectedChildByParent(parentId);
        return ResponseEntity.ok(BaseResponse.success("연결된 아이 조회 성공", response));
    }

    @GetMapping("/children/parent")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<ChildConnectedParentResponseDto>> getConnectedParentByChild(
        @LoginUserId UUID childrenId
    ) {
        ChildConnectedParentResponseDto response = userService.getConnectedParentByChild(childrenId);
        return ResponseEntity.ok(BaseResponse.success("연결된 부모 조회 성공", response));
    }

    @GetMapping("/parents/search")
    public ResponseEntity<BaseResponse<ParentSummaryResponseDto>> getParentByEmail(
        @RequestParam String email
    ) {
        ParentSummaryResponseDto response = userService.getParentByEmail(email);
        return ResponseEntity.ok(BaseResponse.success("부모 조회 성공", response));
    }

    @PostMapping("/children/parent-relations")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<ParentSummaryResponseDto>> connectParent(
        @LoginUserId UUID childrenId,
        @RequestBody @Valid ParentConnectRequestDto request
    ) {
        ParentSummaryResponseDto response = userService.connectParent(childrenId, request);
        return ResponseEntity.ok(BaseResponse.success("부모 연결 성공", response));
    }

    @GetMapping("/children/{childrenId}/parent-receiver")
    public ResponseEntity<BaseResponse<ParentReceiverResponseDto>> getParentReceiver(
        @PathVariable UUID childrenId
    ) {
        ParentReceiverResponseDto response =
            userService.getParentReceiverByChildrenId(childrenId);

        return ResponseEntity.ok(
            BaseResponse.success("자녀의 부모 알림 수신자 조회 성공", response)
        );
    }
}

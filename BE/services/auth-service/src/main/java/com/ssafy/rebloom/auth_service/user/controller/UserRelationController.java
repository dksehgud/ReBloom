package com.ssafy.rebloom.auth_service.user.controller;

import com.ssafy.rebloom.auth_service.user.dto.request.CounselorRelationRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.ParentConnectRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.*;
import com.ssafy.rebloom.auth_service.user.service.UserService;
import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.common.dto.ListResponseDto;
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
        return ResponseEntity.ok(BaseResponse.success("상담사 연결 아이 목록 조회 성공", response));
    }

    @GetMapping("/counselors/relations/parents")
    @PreAuthorize("hasRole('COUNSELOR')")
    public ResponseEntity<BaseResponse<ListResponseDto<CounselorParentRelationResponseDto>>> getCounselorParentRelations(
        @LoginUserId UUID counselorId
    ) {
        ListResponseDto<CounselorParentRelationResponseDto> response =
            userService.getCounselorParentRelations(counselorId);
        return ResponseEntity.ok(BaseResponse.success("상담사 부모 연결 조회 성공", response));
    }

    @PostMapping("/counselors/relations/parents/{parentId}/accept")
    @PreAuthorize("hasRole('COUNSELOR')")
    public ResponseEntity<BaseResponse<CounselorParentRelationResponseDto>> acceptCounselorRelation(
        @LoginUserId UUID counselorId,
        @PathVariable UUID parentId
    ) {
        CounselorParentRelationResponseDto response =
            userService.acceptCounselorRelation(counselorId, parentId);
        return ResponseEntity.ok(BaseResponse.success("상담사 연결 수락 성공", response));
    }

    @DeleteMapping("/counselors/relations/parents/{parentId}")
    @PreAuthorize("hasRole('COUNSELOR')")
    public ResponseEntity<BaseResponse<Void>> rejectCounselorRelation(
        @LoginUserId UUID counselorId,
        @PathVariable UUID parentId
    ) {
        userService.rejectCounselorRelation(counselorId, parentId);
        return ResponseEntity.ok(BaseResponse.success("상담사 연결 요청 거절 성공"));
    }

    @GetMapping("/parents/relations/counselors")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<ParentCounselorResponseDto>> getParentCounselorRelation(
        @LoginUserId UUID parentId
    ) {
        ParentCounselorResponseDto response = userService.getParentCounselor(parentId);
        return ResponseEntity.ok(BaseResponse.success("상담사 연결 조회 성공", response));
    }

    @PostMapping("/parents/relations/counselors")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<CounselorRelationResponseDto>> requestCounselorRelation(
        @LoginUserId UUID parentId,
        @RequestBody @Valid CounselorRelationRequestDto request
    ) {
        CounselorRelationResponseDto response = userService.requestCounselorRelation(parentId, request);
        return ResponseEntity.ok(BaseResponse.success("상담사 등록 요청 성공", response));
    }

    @DeleteMapping("/parents/relations/counselors")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<Void>> deleteCounselorRelation(
        @LoginUserId UUID parentId,
        @RequestParam String counselorEmail
    ) {
        userService.deleteCounselorRelation(parentId, counselorEmail);
        return ResponseEntity.ok(BaseResponse.success("상담사 연결 해제 성공"));
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

    @GetMapping("/children/counselor")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<ChildConnectedCounselorResponseDto>> getConnectedCounselorByChild(
        @LoginUserId UUID childrenId
    ) {
        ChildConnectedCounselorResponseDto response = userService.getConnectedCounselorByChild(childrenId);
        return ResponseEntity.ok(BaseResponse.success("연결된 상담사 조회 성공", response));
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


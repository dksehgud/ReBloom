package com.ssafy.rebloom.auth_service.user.controller;

import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import com.ssafy.rebloom.auth_service.user.repository.ChildrenCounselorRelationRepository;
import com.ssafy.rebloom.auth_service.user.repository.ChildrenParentRelationRepository;
import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/relations/access")
public class RelationAccessController {

    private final ChildrenCounselorRelationRepository childrenCounselorRelationRepository;
    private final ChildrenParentRelationRepository childrenParentRelationRepository;

    @GetMapping("/counselors/{counselorId}/children/{childrenId}")
    @PreAuthorize("hasRole('COUNSELOR')")
    public ResponseEntity<BaseResponse<Void>> validateCounselorChildAccess(
        @LoginUserId UUID loginUserId,
        @PathVariable UUID counselorId,
        @PathVariable UUID childrenId
    ) {
        validateLoginUser(loginUserId, counselorId);
        validateCounselorChildRelation(counselorId, childrenId);

        return ResponseEntity.ok(BaseResponse.success("access verified"));
    }

    @GetMapping("/parents/{parentId}/children/{childrenId}")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<BaseResponse<Void>> validateParentChildAccess(
        @LoginUserId UUID loginUserId,
        @PathVariable UUID parentId,
        @PathVariable UUID childrenId
    ) {
        validateLoginUser(loginUserId, parentId);
        validateParentChildRelation(parentId, childrenId);

        return ResponseEntity.ok(BaseResponse.success("access verified"));
    }

    private void validateLoginUser(UUID loginUserId, UUID pathUserId) {
        if (!loginUserId.equals(pathUserId)) {
            throw new CustomException("본인의 관계만 조회할 수 있습니다.", ErrorCode.FORBIDDEN);
        }
    }

    private void validateCounselorChildRelation(UUID counselorId, UUID childrenId) {
        boolean hasAccess = childrenCounselorRelationRepository.existsActiveRelation(
            counselorId,
            childrenId,
            RelationStatus.ACTIVE,
            LocalDateTime.now()
        );

        if (!hasAccess) {
            throw new CustomException("상담사가 해당 아이에게 접근할 권한이 없습니다.", ErrorCode.FORBIDDEN);
        }
    }

    private void validateParentChildRelation(UUID parentId, UUID childrenId) {
        boolean hasAccess = childrenParentRelationRepository.existsActiveRelation(
            parentId,
            childrenId,
            RelationStatus.ACTIVE
        );

        if (!hasAccess) {
            throw new CustomException("부모가 해당 아이에게 접근할 권한이 없습니다.", ErrorCode.FORBIDDEN);
        }
    }
}

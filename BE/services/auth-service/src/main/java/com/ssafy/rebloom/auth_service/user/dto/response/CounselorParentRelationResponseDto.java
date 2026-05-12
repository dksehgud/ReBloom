package com.ssafy.rebloom.auth_service.user.dto.response;

import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenParentRelation;
import com.ssafy.rebloom.auth_service.user.domain.entity.ParentCounselorRelation;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import java.util.UUID;

public record CounselorParentRelationResponseDto(
    UUID parentId,
    String parentName,
    String parentEmail,
    UUID childrenId,
    String childrenName,
    RelationStatus relationStatus
) {

    public static CounselorParentRelationResponseDto from(
        ParentCounselorRelation parentCounselorRelation,
        ChildrenParentRelation childrenParentRelation
    ) {
        return new CounselorParentRelationResponseDto(
            parentCounselorRelation.getParent().getId(),
            parentCounselorRelation.getParent().getName(),
            parentCounselorRelation.getParent().getEmail(),
            childrenParentRelation.getChildren().getId(),
            childrenParentRelation.getChildren().getName(),
            parentCounselorRelation.getRelationStatus()
        );
    }
}

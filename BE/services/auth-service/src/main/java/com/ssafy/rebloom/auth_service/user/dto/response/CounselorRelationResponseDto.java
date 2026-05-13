package com.ssafy.rebloom.auth_service.user.dto.response;

import com.ssafy.rebloom.auth_service.user.domain.entity.ParentCounselorRelation;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import java.util.UUID;

public record CounselorRelationResponseDto(
    UUID counselorId,
    RelationStatus relationStatus
) {

    public static CounselorRelationResponseDto from(ParentCounselorRelation relation) {
        return new CounselorRelationResponseDto(
            relation.getCounselor().getId(),
            relation.getRelationStatus()
        );
    }
}

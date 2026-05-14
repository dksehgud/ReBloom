package com.ssafy.rebloom.auth_service.user.service;

import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.dto.request.CounselorRelationRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.ParentConnectRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.PasswordChangeRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserUpdateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildConnectedCounselorResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildConnectedParentResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.CounselorChildrenResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.CounselorParentRelationResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.CounselorRelationResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ParentConnectedChildResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ParentCounselorResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ParentReceiverResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ParentSummaryResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.UserInfoResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.UserProfileResponseDto;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import java.util.UUID;

public interface UserService {

    boolean isAlreadyExistsEmail(String email);

    void signupUser(UserCreateRequestDto userCreateRequestDto);

    void withDrawUser(UUID userId);

    UserInfoResponseDto getMyInfo(UUID userId);

    UserInfoResponseDto updateMyInfo(UUID userId, UserUpdateRequestDto request);

    CounselorChildrenResponseDto getCounselorChildren(UUID counselorId);

    ListResponseDto<CounselorParentRelationResponseDto> getCounselorParentRelations(UUID counselorId);

    CounselorParentRelationResponseDto acceptCounselorRelation(UUID counselorId, UUID parentId);

    void rejectCounselorRelation(UUID counselorId, UUID parentId);

    ParentCounselorResponseDto getParentCounselor(UUID parentId);

    CounselorRelationResponseDto requestCounselorRelation(
        UUID parentId,
        CounselorRelationRequestDto request
    );

    void deleteCounselorRelation(UUID parentId, String counselorEmail);

    ParentConnectedChildResponseDto getConnectedChildByParent(UUID parentId);

    ChildConnectedParentResponseDto getConnectedParentByChild(UUID childrenId);

    ChildConnectedCounselorResponseDto getConnectedCounselorByChild(UUID childrenId);

    ParentSummaryResponseDto getParentByEmail(String email);

    ParentSummaryResponseDto connectParent(UUID childrenId, ParentConnectRequestDto request);

    void changePassword(UUID userId, PasswordChangeRequestDto request);

    void verifyPassword(UUID userId, String password);

    ListResponseDto<UserProfileResponseDto> searchProfiles(String email, UserRole userRole);

    ParentReceiverResponseDto getParentReceiverByChildrenId(UUID childrenId);
}

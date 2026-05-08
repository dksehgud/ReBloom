package com.ssafy.rebloom.auth_service.user.service;

import com.ssafy.rebloom.auth_service.user.dto.request.ParentConnectRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserUpdateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.*;

import java.util.UUID;

public interface UserService {

    boolean isAlreadyExistsEmail(String email);

    void signupUser(UserCreateRequestDto userCreateRequestDto);

    void withDrawUser(UUID userId);

    UserInfoResponseDto getMyInfo(UUID userId);

    UserInfoResponseDto updateMyInfo(UUID userId, UserUpdateRequestDto request);

    CounselorChildrenResponseDto getCounselorChildren(UUID counselorId);

    ParentCounselorResponseDto getParentCounselor(UUID parentId);

    ParentConnectedChildResponseDto getConnectedChildByParent(UUID parentId);

    ChildConnectedParentResponseDto getConnectedParentByChild(UUID childrenId);

    ParentSummaryResponseDto getParentByEmail(String email);

    ParentSummaryResponseDto connectParent(UUID childrenId, ParentConnectRequestDto request);

    void changePassword(UUID userId, String newPassword);

    void verifyPassword(UUID userId, String password);
}

package com.ssafy.rebloom.auth_service.user.service;

import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserUpdateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.UserInfoResponseDto;
import java.util.UUID;

public interface UserService {

    boolean isAlreadyExistsEmail(String email);

    void signupUser(UserCreateRequestDto userCreateRequestDto);

    void withDrawUser(UUID userId);

    UserInfoResponseDto getMyInfo(UUID userId);

    UserInfoResponseDto updateMyInfo(UUID userId, UserUpdateRequestDto request);

    void changePassword(UUID userId, String newPassword);

    void verifyPassword(UUID userId, String password);
}

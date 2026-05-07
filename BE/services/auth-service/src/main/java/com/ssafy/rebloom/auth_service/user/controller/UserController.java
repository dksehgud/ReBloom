package com.ssafy.rebloom.auth_service.user.controller;

import com.ssafy.rebloom.auth_service.auth.service.AuthService;
import com.ssafy.rebloom.auth_service.auth.util.CookieUtil;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.dto.request.PasswordChangeRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.PasswordVerifyRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserUpdateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.UserInfoResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.UserProfileResponseDto;
import com.ssafy.rebloom.auth_service.user.service.UserService;
import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping
    public ResponseEntity<BaseResponse<Void>> signup(
        @RequestBody @Valid UserCreateRequestDto userCreateRequestDto
    ) {
        userService.signupUser(userCreateRequestDto);
        return ResponseEntity.ok(BaseResponse.success("회원가입 성공"));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<Void>> withdraw(
        @LoginUserId UUID userId
    ) {
        // 회원 탈퇴
        userService.withDrawUser(userId);
        // 토큰 만료
        authService.revokeTokens(userId);

        ResponseCookie deleteCookie = cookieUtil.deleteRefreshTokenCookie();

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
            .body(BaseResponse.success("회원 탈퇴가 완료되었습니다."));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<UserInfoResponseDto>> getMyInfo(
        @LoginUserId UUID userId
    ) {
        UserInfoResponseDto response = userService.getMyInfo(userId);
        return ResponseEntity.ok(BaseResponse.success("정보 확인 성공", response));
    }

    @PatchMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<UserInfoResponseDto>> updateMyInfo(
        @LoginUserId UUID userId,
        @RequestBody @Valid UserUpdateRequestDto request
    ) {
        UserInfoResponseDto response = userService.updateMyInfo(userId, request);
        return ResponseEntity.ok(BaseResponse.success("유저 정보 수정 성공", response));
    }

    @PatchMapping("/passwords")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<Void>> changePassword(
        @LoginUserId UUID userId,
        @RequestBody @Valid PasswordChangeRequestDto request
    ) {
        userService.changePassword(userId, request);
        return ResponseEntity.ok(BaseResponse.success("비밀번호가 변경되었습니다."));
    }

    @PostMapping("/passwords/verifications")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<Void>> verifyPassword(
        @LoginUserId UUID userId,
        @RequestBody @Valid PasswordVerifyRequestDto request
    ) {
        userService.verifyPassword(userId, request.password());
        return ResponseEntity.ok(BaseResponse.success("현재 비밀번호가 일치합니다."));
    }

    @GetMapping("/profiles")
    public ResponseEntity<BaseResponse<ListResponseDto<UserProfileResponseDto>>> searchUserProfile(
        @RequestParam(value = "email", required = true) String email,
        @RequestParam(value = "name", required = true) String name,
        @RequestParam(value = "role", required = true) UserRole role
    ) {
        ListResponseDto<UserProfileResponseDto> userProfiles = userService.searchProfiles(email, name, role);
        return ResponseEntity.ok(BaseResponse.success("유저 프로필 조회 성공", userProfiles));
    }
}

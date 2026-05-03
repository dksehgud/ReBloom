package com.ssafy.rebloom.auth_service.auth.controller;

import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import com.ssafy.rebloom.auth_service.auth.dto.TokenDto;
import com.ssafy.rebloom.auth_service.auth.dto.request.EmailDuplicateRequestDto;
import com.ssafy.rebloom.auth_service.auth.dto.request.LoginRequestDto;
import com.ssafy.rebloom.auth_service.auth.dto.response.EmailDuplicateResponseDto;
import com.ssafy.rebloom.auth_service.auth.dto.response.LoginResponseDto;
import com.ssafy.rebloom.auth_service.auth.service.AuthService;
import com.ssafy.rebloom.auth_service.auth.util.CookieUtil;
import com.ssafy.rebloom.auth_service.user.service.UserService;
import com.ssafy.rebloom.common.dto.BaseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final CookieUtil cookieUtil;

    @PostMapping("/login")
    public ResponseEntity<BaseResponse<LoginResponseDto>> login(
        @Valid @RequestBody LoginRequestDto loginRequestDto
    ) {
        TokenDto tokenDto = authService.login(loginRequestDto);

        return sendTokenResponse("로그인 성공", tokenDto);
    }

    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(
        @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        authService.logout(refreshToken);

        ResponseCookie deleteCookie = cookieUtil.deleteRefreshTokenCookie();

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
            .body(BaseResponse.success("로그아웃 성공"));
    }

    @PostMapping("/reissue")
    public ResponseEntity<BaseResponse<LoginResponseDto>> reissue(
        @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        TokenDto tokenDto = authService.reissue(refreshToken);

        return sendTokenResponse("토큰 재발급 성공", tokenDto);
    }

    @PostMapping("/emails/duplications")
    public ResponseEntity<BaseResponse<EmailDuplicateResponseDto>> isEmailAlreadyExists(
        @RequestBody @Valid EmailDuplicateRequestDto emailDuplicateRequestDto
    ) {
        boolean isDuplicate = userService.isAlreadyExistsEmail(
            emailDuplicateRequestDto.email());
        return ResponseEntity.ok(
            BaseResponse.success("이메일 중복 확인 조회 성공", EmailDuplicateResponseDto.from(isDuplicate)));
    }

    private ResponseEntity<BaseResponse<LoginResponseDto>> sendTokenResponse(
        String responseMessage, TokenDto tokenDto) {
        ResponseCookie refreshTokenCookie = cookieUtil.createRefreshTokenCookie(
            tokenDto.refreshToken(),
            authService.getRefreshTokenMaxAgeSeconds()
        );

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
            .header(HttpHeaders.AUTHORIZATION, Constants.BEARER_PREFIX + tokenDto.accessToken())
            .body(BaseResponse.success(responseMessage,
                LoginResponseDto.of(tokenDto.accessToken(), tokenDto.refreshToken()))
            );
    }
}

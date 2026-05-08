package com.ssafy.rebloom.auth_service.auth.service;

import com.ssafy.rebloom.auth_service.auth.dto.TokenDto;
import com.ssafy.rebloom.auth_service.auth.dto.request.LoginRequestDto;
import java.util.UUID;

public interface AuthService {

    TokenDto login(LoginRequestDto loginRequestDto);

    void logout(String refreshToken);

    void revokeTokens(UUID userId);

    TokenDto reissue(String refreshToken);

    long getRefreshTokenMaxAgeSeconds();

    void sendVerificationEmail(String email);

    boolean verifyEmailCode(String email, String code);

    void resetPassword(String email);
}

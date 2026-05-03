package com.ssafy.rebloom.auth_service.auth.service.impl;

import com.ssafy.rebloom.auth_service.auth.dto.TokenDto;
import com.ssafy.rebloom.auth_service.auth.dto.request.LoginRequestDto;
import com.ssafy.rebloom.auth_service.auth.security.CustomUserDetails;
import com.ssafy.rebloom.auth_service.auth.service.AuthService;
import com.ssafy.rebloom.auth_service.auth.service.RefreshTokenService;
import com.ssafy.rebloom.auth_service.auth.util.JwtUtil;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Override
    public TokenDto login(LoginRequestDto loginRequestDto) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequestDto.email(),
                    loginRequestDto.password()
                )
            );

            UUID userId = extractUserId(authentication);
            UserRole userRole = extracntUserRole(authentication);
            log.info("userId = {}", userId);
            String accessToken = jwtUtil.createAccessToken(userId, userRole);
            String refreshToken = jwtUtil.createRefreshToken(userId);

            refreshTokenService.save(
                userId,
                refreshToken,
                getRefreshTokenMaxAgeSeconds()
            );

            return TokenDto.from(accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            throw new CustomException("이메일 또는 비밀번호가 올바르지 않습니다.", ErrorCode.LOGIN_FAILED);
        } catch (DisabledException e) {
            throw new CustomException("탈퇴한 사용자입니다.", ErrorCode.USER_WITHDRAW);
        } catch (AuthenticationException e) {
            throw new CustomException("인증에 실패했습니다.", ErrorCode.LOGIN_FAILED);
        }
    }

    @Override
    public void logout(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            return;
        }

        if (!jwtUtil.validateToken(refreshToken)) {
            return;
        }

        UUID userId = jwtUtil.getUserId(refreshToken);
        refreshTokenService.delete(userId);
    }

    @Override
    public TokenDto reissue(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            throw new CustomException("리프레시 토큰이 없습니다.", ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }

        if (!jwtUtil.validateToken(refreshToken)) {
            throw new CustomException("리프레시 토큰이 만료되었습니다. 재로그인 필요", ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        UUID userId = jwtUtil.getUserId(refreshToken);
        if (!refreshTokenService.matches(userId, refreshToken)) {
            refreshTokenService.delete(userId);
            throw new CustomException("리프레시 토큰이 일치하지 않습니다.", ErrorCode.INVALID_REFRESH_TOKEN);
        }

        User user = userRepository.findById(userId).
            orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND.getMessage(),
                ErrorCode.USER_NOT_FOUND));

        String newAccessToken = jwtUtil.createAccessToken(userId, user.getRole());
        String newRefreshToken = jwtUtil.createRefreshToken(userId);

        refreshTokenService.save(
            userId,
            newRefreshToken,
            getRefreshTokenMaxAgeSeconds()
        );

        return TokenDto.from(newAccessToken, newRefreshToken);
    }

    @Override
    public long getRefreshTokenMaxAgeSeconds() {
        return jwtUtil.getRefreshTokenExpireTimeMillis() / 1000;
    }

    private UUID extractUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUserId();
        }
        throw new CustomException("인증 정보 추출 실패", ErrorCode.INTERNAL_SERVER_ERROR);
    }

    private UserRole extracntUserRole(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUserRole();
        }
        throw new CustomException("인증 정보 추출 실패", ErrorCode.INTERNAL_SERVER_ERROR);
    }
}

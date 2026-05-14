package com.ssafy.rebloom.auth_service.auth.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import com.ssafy.rebloom.auth_service.auth.dto.OAuth2LoginResult;
import com.ssafy.rebloom.auth_service.auth.dto.OAuth2SignupInfo;
import com.ssafy.rebloom.auth_service.auth.dto.TokenDto;
import com.ssafy.rebloom.auth_service.auth.service.OAuth2LoginService;
import com.ssafy.rebloom.auth_service.auth.service.RefreshTokenService;
import com.ssafy.rebloom.auth_service.auth.util.JwtUtil;
import com.ssafy.rebloom.auth_service.user.domain.entity.SocialUser;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserStatus;
import com.ssafy.rebloom.auth_service.user.repository.SocialUserRepository;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
import com.ssafy.rebloom.auth_service.user.service.RedisService;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class OAuth2LoginServiceImpl implements OAuth2LoginService {

    private static final long OAUTH2_SIGNUP_EXPIRE_MINUTES = 10L;

    private final UserRepository userRepository;
    private final SocialUserRepository socialUserRepository;
    private final RedisService redisService;
    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    @Override
    @Transactional
    public OAuth2LoginResult loginOrRegister(String provider, String providerUserId, String email, String name) {
        validateOAuth2UserInfo(provider, providerUserId, email);

        return socialUserRepository.findByProviderAndProviderUserId(provider, providerUserId)
            .map(SocialUser::getUser)
            .or(() -> connectExistingUser(provider, providerUserId, email))
            .map(this::issueLoginResult)
            .orElseGet(() -> createSignupResult(provider, providerUserId, email, name));
    }

    private java.util.Optional<User> connectExistingUser(String provider, String providerUserId, String email) {
        return userRepository.findByEmail(email)
            .map(user -> {
                socialUserRepository.save(SocialUser.builder()
                    .provider(provider)
                    .providerUserId(providerUserId)
                    .user(user)
                    .build());
                return user;
            });
    }

    private OAuth2LoginResult issueLoginResult(User user) {
        if (user.getStatus() == UserStatus.WITHDRAW) {
            throw new CustomException("?덊눜???ъ슜?먯엯?덈떎.", ErrorCode.USER_WITHDRAW);
        }

        String accessToken = jwtUtil.createAccessToken(user.getId(), user.getRole());
        String refreshToken = jwtUtil.createRefreshToken(user.getId());

        refreshTokenService.save(user.getId(), refreshToken, jwtUtil.getRefreshTokenExpireTimeMillis());

        return OAuth2LoginResult.login(TokenDto.from(accessToken, refreshToken));
    }

    private OAuth2LoginResult createSignupResult(
        String provider,
        String providerUserId,
        String email,
        String name
    ) {
        String registerUUID = UUID.randomUUID().toString();
        OAuth2SignupInfo signupInfo = new OAuth2SignupInfo(provider, providerUserId, email, name);

        try {
            redisService.setDataWithExpire(
                Constants.OAUTH2_SIGNUP_PREFIX + registerUUID,
                objectMapper.writeValueAsString(signupInfo),
                OAUTH2_SIGNUP_EXPIRE_MINUTES,
                TimeUnit.MINUTES
            );
        } catch (JsonProcessingException e) {
            throw new CustomException("OAuth signup data cannot be saved.", ErrorCode.INTERNAL_SERVER_ERROR);
        }

        return OAuth2LoginResult.signupRequired(registerUUID, provider, email, name);
    }

    private void validateOAuth2UserInfo(String provider, String providerUserId, String email) {
        if (!StringUtils.hasText(provider)) {
            throw new CustomException("OAuth provider is required.", ErrorCode.INVALID_PARAMETER);
        }
        if (!StringUtils.hasText(providerUserId)) {
            throw new CustomException("OAuth provider user id is required.", ErrorCode.INVALID_PARAMETER);
        }
        if (!StringUtils.hasText(email)) {
            throw new CustomException("OAuth email is required.", ErrorCode.INVALID_PARAMETER);
        }
    }
}

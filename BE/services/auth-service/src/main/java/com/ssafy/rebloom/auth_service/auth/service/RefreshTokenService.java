package com.ssafy.rebloom.auth_service.auth.service;

import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final StringRedisTemplate stringRedisTemplate;

    public void save(UUID userId, String refreshToken, long refreshTokenExpireTimeMillis) {
        String key = generateKey(userId);
        stringRedisTemplate.opsForValue().set(
            key,
            refreshToken,
            Duration.ofMillis(refreshTokenExpireTimeMillis)
        );
    }

    public boolean matches(UUID userId, String refreshToken) {
        String savedRefreshToken = stringRedisTemplate.opsForValue().get(generateKey(userId));
        return refreshToken != null && refreshToken.equals(savedRefreshToken);
    }

    public void delete(UUID userId) {
        stringRedisTemplate.delete(generateKey(userId));
    }

    private String generateKey(UUID userId) {
        return Constants.REFRESH_TOKEN_COOKIE_NAME + userId;
    }
}
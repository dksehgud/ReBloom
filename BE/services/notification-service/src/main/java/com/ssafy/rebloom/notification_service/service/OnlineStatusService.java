package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OnlineStatusService {


    private final RedisService redisService;

    public void markOnline(UUID userId, ReceiverRole role) {
        redisService.set(key(userId), role.name(), Duration.ofSeconds(Constants.ONLINE_TTL));
    }

    public void refresh(UUID userId) {
        String current = redisService.get(key(userId));
        if (current != null) {
            redisService.set(key(userId), current, Duration.ofSeconds(Constants.ONLINE_TTL));
        }
    }

    public void markOffline(UUID userId) {
        redisService.delete(key(userId));
    }

    public boolean isOnline(UUID userId) {
        return redisService.exists(key(userId));
    }

    private String key(UUID userId) {
        return Constants.ONLINE_KEY_PREFIX + userId;
    }
}
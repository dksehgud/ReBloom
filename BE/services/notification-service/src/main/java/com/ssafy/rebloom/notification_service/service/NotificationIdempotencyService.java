package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.constants.Constants;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationIdempotencyService {
    private static final Duration PROCESSING_TTL = Duration.ofMinutes(Constants.PROCESSING_TTL);
    private static final Duration COMPLETED_TTL = Duration.ofDays(Constants.COMPLETED_TTL);

    private final RedisService redisService;

    public boolean tryStart(String idempotencyKey, String eventId) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return true;
        }

        return redisService.setIfAbsent(
            key(idempotencyKey),
            "PROCESSING:" + eventId,
            PROCESSING_TTL
        );
    }

    public void markCompleted(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        redisService.set(
            key(idempotencyKey),
            "COMPLETED",
            COMPLETED_TTL
        );
    }

    public void clear(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        redisService.delete(key(idempotencyKey));
    }

    private String key(String idempotencyKey) {
        return Constants.KEY_PREFIX + idempotencyKey;
    }
}

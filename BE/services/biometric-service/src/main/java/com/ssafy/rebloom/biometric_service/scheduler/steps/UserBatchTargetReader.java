package com.ssafy.rebloom.biometric_service.scheduler.steps;

import com.ssafy.rebloom.biometric_service.constants.Constants;
import com.ssafy.rebloom.biometric_service.service.RedisService;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserBatchTargetReader {

    private final RedisService redisService;

    public List<UUID> findTargetUserIds() {
        Set<String> keys = redisService.keys(Constants.TRAIN_REQUESTED_KEY_PREFIX + "*");
        if (keys == null || keys.isEmpty()) {
            return Collections.emptyList();
        }

        return keys.stream()
            .map(this::parseUserId)
            .flatMap(List::stream)
            .toList();
    }

    private List<UUID> parseUserId(String key) {
        String value = key.substring(Constants.TRAIN_REQUESTED_KEY_PREFIX.length());
        try {
            return List.of(UUID.fromString(value));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid training requested key. key={}", key);
            return Collections.emptyList();
        }
    }
}

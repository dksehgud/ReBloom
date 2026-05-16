package com.ssafy.rebloom.notification_service.service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate redisTemplate;

    public boolean exists(String key) {
        Boolean exists = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(exists);
    }

    public String get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void set(String key, String value, Duration ttl) {
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    public boolean setIfAbsent(String key, String value, Duration ttl) {
        Boolean success = redisTemplate.opsForValue().setIfAbsent(key, value, ttl);
        return Boolean.TRUE.equals(success);
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public Set<String> scanKeys(String pattern) {
        return redisTemplate.execute((RedisConnection connection) -> {
            Set<String> keys = new HashSet<>();

            try (Cursor<byte[]> cursor = connection.scan(
                ScanOptions.scanOptions()
                    .match(pattern)
                    .count(100)
                    .build()
            )) {
                while (cursor.hasNext()) {
                    keys.add(new String(cursor.next(), StandardCharsets.UTF_8));
                }
            }

            return keys;
        });
    }

    private static final DefaultRedisScript<Long> DELETE_IF_VALUE_EQUALS_SCRIPT =
        new DefaultRedisScript<>(
            """
            if redis.call("GET", KEYS[1]) == ARGV[1] then
                return redis.call("DEL", KEYS[1])
            else
                return 0
            end
            """,
            Long.class
        );

    public boolean deleteIfValueEquals(String key, String expectedValue) {
        Long deleted = redisTemplate.execute(
            DELETE_IF_VALUE_EQUALS_SCRIPT,
            Collections.singletonList(key),
            expectedValue
        );

        return deleted != null && deleted > 0;
    }
}
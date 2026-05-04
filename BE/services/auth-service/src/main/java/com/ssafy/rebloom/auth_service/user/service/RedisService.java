package com.ssafy.rebloom.auth_service.user.service;

import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate stringRedisTemplate;

    public String getData(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }

    public void setDataWithExpire(String key, String value, long duration, TimeUnit timeUnit) {
        stringRedisTemplate.opsForValue().set(key, value, duration, timeUnit);
    }

    public void deleteData(String key) {
        stringRedisTemplate.delete(key);
    }

    public boolean hasKey(String key) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(key));
    }
}

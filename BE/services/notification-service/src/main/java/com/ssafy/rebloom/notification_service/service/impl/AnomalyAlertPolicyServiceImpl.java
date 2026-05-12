package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertPolicyService;
import com.ssafy.rebloom.notification_service.service.RedisService;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnomalyAlertPolicyServiceImpl implements AnomalyAlertPolicyService {

    private final RedisService redisService;
    @Override
    public boolean tryAcquireAlertCoolTime(UUID childrenId) {
        return redisService.setIfAbsent(
            anomalyCooldownKey(childrenId),
            "1",
            Duration.ofMinutes(Constants.ALERT_COOL_TIME)
        );
    }

    private String anomalyCooldownKey(UUID childrenId) {
        return Constants.ALERT_COOL_TIME_KEY_PREFIX + ":" + childrenId;
    }
}

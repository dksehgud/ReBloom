package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertService;
import com.ssafy.rebloom.notification_service.service.AuthServiceResolveService;
import com.ssafy.rebloom.notification_service.service.MqttPublishService;
import com.ssafy.rebloom.notification_service.service.RedisService;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyAlertServiceImpl implements AnomalyAlertService {

    private final RedisService redisService;
    private final AuthServiceResolveService authServiceResolveService;
    private final MqttPublishService mqttPublishService;

    @Override
    public void handleValidAnomaly(UUID childrenId, String correlationId) {
        long count = increaseWindowCount(childrenId);
        if (count < Constants.CONVERSATION_THRESHOLD) {
            log.debug("Anomaly window count increased. childrenId={}, count={}", childrenId, count);
            return;
        }

        ChildrenIotInfoResponseDto iotInfo =
            authServiceResolveService.resolveChildrenIotInfo(childrenId);

        if (!acquireConversationLock(childrenId)) {
            log.debug("Conversation initiation ignored by lock. childrenId={}", childrenId);
            return;
        }

        try {
            mqttPublishService.publishConversationStart(iotInfo, correlationId);
        } catch (Exception e) {
            log.error(
                "Failed to publish MQTT conversation start message. childrenId={}, serialNumber={}",
                childrenId,
                iotInfo.serialNumber(),
                e
            );
        }
    }

    private long increaseWindowCount(UUID childrenId) {
        String key = anomalyWindowKey(childrenId);
        long count = redisService.incrementBy(key, 1L);

        if (count == 1L) {
            redisService.set(
                key,
                String.valueOf(count),
                Duration.ofMinutes(Constants.ALERT_WINDOW)
            );
        }

        return count;
    }

    private boolean acquireConversationLock(UUID childrenId) {
        return redisService.setIfAbsent(
            conversationLockKey(childrenId),
            "1",
            Duration.ofMinutes(Constants.CONVERSATION_COOL_TIME)
        );
    }

    private String anomalyWindowKey(UUID childrenId) {
        return Constants.ALERT_WINDOW_KEY_PREFIX + ":" + childrenId;
    }

    private String conversationLockKey(UUID childrenId) {
        return Constants.CONVERSATION_LOCK_KEY_PREFIX + childrenId;
    }
}
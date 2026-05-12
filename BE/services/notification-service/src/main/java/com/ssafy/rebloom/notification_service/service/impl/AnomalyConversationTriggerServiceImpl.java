package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.event.dto.AnomalyEvent;
import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.dto.response.ChildIotDeviceResponseDto;
import com.ssafy.rebloom.notification_service.service.AnomalyConversationTriggerService;
import com.ssafy.rebloom.notification_service.service.ChildDeviceResolveService;
import com.ssafy.rebloom.notification_service.service.ConversationMqttPublishService;
import com.ssafy.rebloom.notification_service.service.RedisService;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyConversationTriggerServiceImpl implements AnomalyConversationTriggerService {

    private final RedisService redisService;
    private final ChildDeviceResolveService childDeviceResolveService;
    private final ConversationMqttPublishService conversationMqttPublishService;
    @Override
    public void handleAnomaly(AnomalyEvent event, String correlationId) {
        UUID childrenId = event.userId();

        long count = increaseWindowCount(childrenId);
        if (count < Constants.CONVERSATION_THRESHOLD) {
            log.debug("Anomaly window count increased. childrenId={}, count={}", childrenId, count);
            return;
        }

        ChildIotDeviceResponseDto iotDevice =
            childDeviceResolveService.resolveIotDeviceByChildrenId(childrenId);

        if (!acquireConversationLock(childrenId)) {
            log.debug("Conversation initiation ignored by lock. childrenId={}", childrenId);
            return;
        }

        triggerConversationStart(iotDevice, correlationId);
    }

    private long increaseWindowCount(UUID childrenId) {
        String key = anomalyWindowKey(childrenId);
        long count = redisService.incrementBy(key, 1L);

        if (count == 1L) {
            redisService.set(key, String.valueOf(count), Duration.ofMinutes(Constants.ALERT_WINDOW));
        }

        return count;
    }

    private boolean acquireConversationLock(UUID childrenId) {
        String key = conversationLockKey(childrenId);
        return redisService.setIfAbsent(
            key,
            "1",
            Duration.ofMinutes(Constants.CONVERSATION_COOL_TIME)
        );
    }

    private void triggerConversationStart(
        ChildIotDeviceResponseDto iotDevice,
        String correlationId
    ) {
        conversationMqttPublishService.publishConversationStart(
            iotDevice,
            correlationId
        );
    }

    private String anomalyWindowKey(UUID childrenId) {
        return Constants.ALERT_WINDOW_KEY_PREFIX + ":" + childrenId;
    }

    private String conversationLockKey(UUID childrenId) {
        return Constants.CONVERSATION_LOCK_KEY_PREFIX + childrenId;
    }

}

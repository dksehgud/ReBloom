package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.GpsCheckRequestedEvent;
import com.ssafy.rebloom.event.publisher.EventPublisher;
import com.ssafy.rebloom.event.support.EventKeyGenerator;
import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertService;
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
    private final EventPublisher eventPublisher;
    private final KafkaCommonProperties kafkaProperties;
    private final EventKeyGenerator eventKeyGenerator;

    @Override
    public void handleValidAnomaly(UUID childrenId, UUID parentId, String correlationId) {
        long count = increaseWindowCount(childrenId);
        if (count < Constants.CONVERSATION_THRESHOLD) {
            log.debug("Anomaly window count increased. childrenId={}, count={}", childrenId, count);
            return;
        }

        if (!acquireConversationLock(childrenId)) {
            log.debug("GPS check request ignored by conversation lock. childrenId={}", childrenId);
            return;
        }

        try {
            publishGpsCheckRequested(childrenId, parentId, correlationId);
        } catch (RuntimeException e) {
            releaseConversationLock(childrenId);
            log.error(
                "Failed to publish GPS check requested event. childrenId={}, parentId={}",
                childrenId,
                parentId,
                e
            );
            throw e;
        }
    }

    @Override
    public void releaseConversationLock(UUID childrenId) {
        redisService.delete(conversationLockKey(childrenId));
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

    private void publishGpsCheckRequested(
        UUID childrenId,
        UUID parentId,
        String correlationId
    ) {
        GpsCheckRequestedEvent payload = new GpsCheckRequestedEvent(
            childrenId,
            parentId
        );

        String key = eventKeyGenerator.userKey(childrenId);
        String idempotencyKey = eventKeyGenerator.idempotencyKey(
            EventTypes.GPS_CHECK_REQUESTED,
            childrenId.toString(),
            correlationId != null ? correlationId : parentId.toString()
        );

        eventPublisher.publish(
            kafkaProperties.getTopics().getGpsCheckRequested(),
            key,
            EventTypes.GPS_CHECK_REQUESTED,
            correlationId,
            idempotencyKey,
            payload
        );
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
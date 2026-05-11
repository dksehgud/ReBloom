package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.dto.AnomalyEvent;
import com.ssafy.rebloom.event.publisher.EventPublisher;
import com.ssafy.rebloom.event.support.EventKeyGenerator;
import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.domain.enums.DeliveryStatus;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationType;
import com.ssafy.rebloom.notification_service.repository.NotificationRepository;
import com.ssafy.rebloom.notification_service.service.NotificationService;
import com.ssafy.rebloom.notification_service.service.RedisService;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final RedisService redisService;
    private final NotificationRepository notificationRepository;
    private final EventPublisher eventPublisher;
    private final EventKeyGenerator eventKeyGenerator;
    private final KafkaCommonProperties kafkaProperties;
    @Override
    @Transactional
    public void handleAnomalyAnalysed(AnomalyEvent event, String correlationId) {
        if (!Boolean.TRUE.equals(event.isAnomaly())) {
            return;
        }

        UUID userId = event.userId();
        Assert.notNull(userId, "event.userId must not be null");

        String coolTimeKey = alertCoolTimeKey(userId);
        boolean firstAlertInCooldown = redisService.setIfAbsent(coolTimeKey, anomalySourceId(event),
            Duration.ofMinutes(Constants.ALERT_COOL_TIME));

        if (!firstAlertInCooldown) {
            return;
        }

        saveRiskAlertNotification(event);

        long alertCount = increaseAlertWindowCount(userId);
        if (alertCount >= Constants.CONVERSATION_THRESHOLD) {
            publishConversationInitiated(event);
        }
    }

    private void saveRiskAlertNotification(AnomalyEvent event) {
        Notification notification = Notification.builder()
            .userId(event.userId())
            .notificationType(NotificationType.RISK_ALERT)
            .title("Health risk alert")
            .content("An anomaly was detected in the biometric signal.")
            .deliveryStatus(DeliveryStatus.PENDING)
            .externalReferenceId(anomalySourceId(event))
            .isRead(false)
            .build();

        Notification.create(
            event.userId(),
            NotificationType.RISK_ALERT,

        )

        notificationRepository.save(notification);
    }

    private String alertCoolTimeKey(UUID userId) {
        return Constants.ALERT_COOL_TIME_KEY_PREFIX + userId;
    }

    private String alertWindowKey(UUID userId) {
        return Constants.ALERT_WINDOW_KEY_PREFIX + userId;
    }

    private String conversationLockKey(UUID userId) {
        return Constants.CONVERSATION_LOCK_KEY_PREFIX + userId;
    }

    private String anomalySourceId(AnomalyEvent event) {
        if (event.id() != null) {
            return String.valueOf(event.id());
        }

        return event.userId() + ":" + event.tsStart() + ":" + event.tsEnd();
    }
}

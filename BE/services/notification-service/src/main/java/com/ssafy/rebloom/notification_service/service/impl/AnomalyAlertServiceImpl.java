package com.ssafy.rebloom.notification_service.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.GpsCheckRequestedEvent;
import com.ssafy.rebloom.event.publisher.EventPublisher;
import com.ssafy.rebloom.event.support.EventKeyGenerator;
import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.AnomalyAlertPhaseState;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertService;
import com.ssafy.rebloom.notification_service.service.NotificationAlertSender;
import com.ssafy.rebloom.notification_service.service.RedisService;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyAlertServiceImpl implements AnomalyAlertService {

    private final RedisService redisService;
    private final ObjectMapper objectMapper;
    private final NotificationAlertSender notificationAlertSender;
    private final EventPublisher eventPublisher;
    private final KafkaCommonProperties kafkaProperties;
    private final EventKeyGenerator eventKeyGenerator;

    @Override
    public void requestGpsCheck(UUID childrenId, UUID parentId, String correlationId) {
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

    @Override
    @Transactional
    public void startPhase(ParentReceiverInfo receiverInfo, String correlationId) {
        LocalDateTime now = now();
        AnomalyAlertPhaseState phase = new AnomalyAlertPhaseState(
            receiverInfo.childrenId(),
            receiverInfo.parentId(),
            receiverInfo.childrenName(),
            correlationId,
            1,
            now,
            now.plusMinutes(Constants.ANOMALY_ALERT_PHASE_INTERVAL_MINUTES)
        );

        boolean started = redisService.setIfAbsent(
            anomalyAlertPhaseKey(receiverInfo.childrenId()),
            writePhase(phase),
            Duration.ofMinutes(Constants.ANOMALY_ALERT_PHASE_TTL)
        );

        if (!started) {
            log.debug(
                "Anomaly alert phase already exists. childrenId={}, parentId={}",
                receiverInfo.childrenId(),
                receiverInfo.parentId()
            );
            return;
        }

        try {
            sendAnomalyRiskAlert(phase);
        } catch (RuntimeException e) {
            redisService.delete(anomalyAlertPhaseKey(receiverInfo.childrenId()));
            throw e;
        }
    }

    @Override
    @Transactional
    public void processDuePhases() {
        Set<String> keys = redisService.scanKeys(
            Constants.ANOMALY_ALERT_PHASE_KEY_PREFIX + "*"
        );

        if (keys == null || keys.isEmpty()) {
            return;
        }

        LocalDateTime now = now();

        for (String key : keys) {
            processPhase(key, now);
        }
    }

    private void processPhase(String key, LocalDateTime now) {
        String raw = redisService.get(key);
        if (raw == null || raw.isBlank()) {
            return;
        }

        AnomalyAlertPhaseState phase = readPhase(raw);
        if (phase.nextActionAt().isAfter(now)) {
            return;
        }

        if (!acquirePhaseLock(phase.childrenId())) {
            return;
        }

        try {
            String latestRaw = redisService.get(key);
            if (latestRaw == null || latestRaw.isBlank()) {
                return;
            }

            AnomalyAlertPhaseState latest = readPhase(latestRaw);
            if (latest.nextActionAt().isAfter(now())) {
                return;
            }

            if (latest.sentCount() < Constants.ANOMALY_ALERT_PHASE_TOTAL_ALERT_COUNT) {
                sendNextAnomalyRiskAlert(latest);
                return;
            }

            requestGpsCheckAndFinishPhase(latest);
        } finally {
            releasePhaseLock(phase.childrenId());
        }
    }

    @Override
    @Transactional
    public void confirmPhase(UUID parentId, UUID childrenId) {
        if (!acquirePhaseLock(childrenId)) {
            return;
        }

        try {
            AnomalyAlertPhaseState phase = resolvePhaseForParent(parentId, childrenId);
            if (phase == null) {
                throw new CustomException(
                    "이미 만료되었거나 처리된 알림입니다.",
                    ErrorCode.ANOMALY_ALERT_PHASE_NOT_FOUND
                );
            }

            redisService.delete(anomalyAlertPhaseKey(childrenId));
        } finally {
            releasePhaseLock(childrenId);
        }
    }

    @Override
    @Transactional
    public void rejectPhase(
        UUID parentId,
        UUID childrenId,
        String correlationId
    ) {
        if (!acquirePhaseLock(childrenId)) {
            return;
        }

        try {
            AnomalyAlertPhaseState phase = resolvePhaseForParent(parentId, childrenId);
            if (phase == null) {
                throw new CustomException(
                    "이미 만료되었거나 처리된 알림입니다.",
                    ErrorCode.ANOMALY_ALERT_PHASE_NOT_FOUND
                );
            }

            requestGpsCheck(
                phase.childrenId(),
                phase.parentId(),
                phase.correlationId() != null ? phase.correlationId() : correlationId
            );

            redisService.delete(anomalyAlertPhaseKey(childrenId));
        } finally {
            releasePhaseLock(childrenId);
        }
    }

    private void requestGpsCheckAndFinishPhase(AnomalyAlertPhaseState phase) {
        requestGpsCheck(
            phase.childrenId(),
            phase.parentId(),
            phase.correlationId()
        );

        redisService.delete(anomalyAlertPhaseKey(phase.childrenId()));
    }

    private void sendNextAnomalyRiskAlert(AnomalyAlertPhaseState phase) {
        sendAnomalyRiskAlert(phase);

        AnomalyAlertPhaseState next = phase.increaseSentCount(
            phase.nextActionAt().plusMinutes(Constants.ANOMALY_ALERT_PHASE_INTERVAL_MINUTES)
        );

        redisService.set(
            anomalyAlertPhaseKey(phase.childrenId()),
            writePhase(next),
            Duration.ofMinutes(Constants.ANOMALY_ALERT_PHASE_TTL)
        );
    }

    private AnomalyAlertPhaseState resolvePhaseForParent(UUID parentId, UUID childrenId) {
        String raw = redisService.get(anomalyAlertPhaseKey(childrenId));
        if (raw == null || raw.isBlank()) {
            return null;
        }

        AnomalyAlertPhaseState phase = readPhase(raw);
        if (!phase.parentId().equals(parentId)) {
            throw new CustomException(
                "해당 이상치 알림 phase를 조작할 권한이 없습니다.",
                ErrorCode.FORBIDDEN
            );
        }

        return phase;
    }

    private boolean acquirePhaseLock(UUID childrenId) {
        return redisService.setIfAbsent(
            anomalyAlertPhaseLockKey(childrenId),
            "1",
            Duration.ofSeconds(Constants.ANOMALY_ALERT_PHASE_LOCK_TTL_SECONDS)
        );
    }

    private void releasePhaseLock(UUID childrenId) {
        redisService.delete(anomalyAlertPhaseLockKey(childrenId));
    }

    private String writePhase(AnomalyAlertPhaseState phase) {
        try {
            return objectMapper.writeValueAsString(phase);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize anomaly alert phase.", e);
        }
    }

    private AnomalyAlertPhaseState readPhase(String raw) {
        try {
            return objectMapper.readValue(raw, AnomalyAlertPhaseState.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize anomaly alert phase.", e);
        }
    }

    private String anomalyAlertPhaseKey(UUID childrenId) {
        return Constants.ANOMALY_ALERT_PHASE_KEY_PREFIX + childrenId;
    }

    private String anomalyAlertPhaseLockKey(UUID childrenId) {
        return Constants.ANOMALY_ALERT_PHASE_LOCK_KEY_PREFIX + childrenId;
    }

    private LocalDateTime now() {
        return LocalDateTime.now(Constants.SEOUL_ZONE_ID);
    }

    private void sendAnomalyRiskAlert(AnomalyAlertPhaseState phase) {
        NotificationPayload payload = NotificationPayload.builder()
            .title("주의 필요")
            .content(String.format(
                "지금 한번 %s에게 관심을 표현해볼까요?",
                phase.childrenName()
            ))
            .childrenId(phase.childrenId())
            .childrenName(phase.childrenName())
            .parentId(phase.parentId())
            .build();

        notificationAlertSender.send(new NotificationCommand(
            phase.parentId(),
            ReceiverRole.PARENT,
            NotificationCode.RISK_ALERT,
            payload
        ));
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

    private String conversationLockKey(UUID childrenId) {
        return Constants.CONVERSATION_LOCK_KEY_PREFIX + childrenId;
    }
}
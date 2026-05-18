package com.ssafy.rebloom.notification_service.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.enums.AnomalyActionStatus;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.AnomalyAlertPhaseState;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.notification_service.repository.NotificationRepository;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertService;
import com.ssafy.rebloom.notification_service.service.AuthServiceResolveService;
import com.ssafy.rebloom.notification_service.service.MqttPublishService;
import com.ssafy.rebloom.notification_service.service.NotificationAlertSender;
import com.ssafy.rebloom.notification_service.service.RedisService;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
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
    private final NotificationRepository notificationRepository;
    private final AuthServiceResolveService authServiceResolveService;
    private final MqttPublishService mqttPublishService;

    private final String instanceId = UUID.randomUUID().toString();

    @Override
    public boolean requestConversationStart(UUID childrenId, UUID parentId, String correlationId) {
        if (!acquireConversationLock(childrenId)) {
            log.debug("Conversation start request ignored by conversation lock. childrenId={}", childrenId);
            return false;
        }

        try {
            ChildrenIotInfoResponseDto iotInfo =
                authServiceResolveService.resolveChildrenIotInfo(childrenId);

            mqttPublishService.publishConversationStart(iotInfo, correlationId);
            return true;
        } catch (RuntimeException e) {
            releaseConversationLock(childrenId);
            log.error(
                "Failed to publish MQTT conversation start. childrenId={}, parentId={}",
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
        if (isPhaseCoolTimeActive(receiverInfo.childrenId())) {
            log.debug(
                "Anomaly alert phase ignored by cooldown. childrenId={}, parentId={}",
                receiverInfo.childrenId(),
                receiverInfo.parentId()
            );
            return;
        }
        log.info("notification-service, anomaly-analysed, phase-start");

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
    public void processDuePhases() {
        Set<String> keys = redisService.scanKeys(
            Constants.ANOMALY_ALERT_PHASE_KEY_PREFIX + "*"
        );

        if (keys == null || keys.isEmpty()) {
            return;
        }

        LocalDateTime now = now();

        for (String key : keys) {
            try {
                processPhase(key, now);
            } catch (IllegalStateException e) {
                log.warn("Invalid anomaly alert phase state. key={}", key, e);
                redisService.delete(key);
            } catch (RuntimeException e) {
                log.error("Failed to process anomaly alert phase. key={}", key, e);
            }
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

        Optional<String> lockToken = acquirePhaseLock(phase.childrenId());
        if (lockToken.isEmpty()) {
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

            requestConversationStartAndFinishPhase(latest);
        } finally {
            releasePhaseLock(phase.childrenId(), lockToken.get());
        }
    }

    @Override
    @Transactional
    public void confirmPhase(UUID parentId, UUID childrenId, Long notificationId) {
        Optional<String> lockToken = acquirePhaseLock(childrenId);
        if (lockToken.isEmpty()) {
            throw new CustomException(
                "현재 이상치 알림 응답을 처리 중입니다.",
                ErrorCode.ANOMALY_ALERT_PHASE_BUSY
            );
        }

        try {
            AnomalyAlertPhaseState phase = resolvePhaseForParent(parentId, childrenId);
            if (phase == null) {
                throw new CustomException(
                    "이미 종료되었거나 만료된 이상치 알림입니다.",
                    ErrorCode.ANOMALY_ALERT_PHASE_NOT_FOUND
                );
            }

            updateAnomalyNotificationActionStatus(
                parentId,
                childrenId,
                notificationId,
                AnomalyActionStatus.CONFIRMED
            );

            redisService.delete(anomalyAlertPhaseKey(childrenId));
            startPhaseCoolTime(childrenId);
        } finally {
            releasePhaseLock(childrenId, lockToken.get());
        }
    }

    @Override
    @Transactional
    public void rejectPhase(
        UUID parentId,
        UUID childrenId,
        Long notificationId,
        String correlationId
    ) {
        Optional<String> lockToken = acquirePhaseLock(childrenId);
        if (lockToken.isEmpty()) {
            throw new CustomException(
                "현재 이상치 알림 응답을 처리 중입니다.",
                ErrorCode.ANOMALY_ALERT_PHASE_BUSY
            );
        }

        try {
            AnomalyAlertPhaseState phase = resolvePhaseForParent(parentId, childrenId);
            if (phase == null) {
                throw new CustomException(
                    "이미 종료되었거나 만료된 이상치 알림입니다.",
                    ErrorCode.ANOMALY_ALERT_PHASE_NOT_FOUND
                );
            }

            updateAnomalyNotificationActionStatus(
                parentId,
                childrenId,
                notificationId,
                AnomalyActionStatus.REJECTED
            );

            boolean requested = requestConversationStart(
                phase.childrenId(),
                phase.parentId(),
                phase.correlationId() != null ? phase.correlationId() : correlationId
            );

            if (!requested) {
                log.debug(
                    "Conversation start request already in progress. childrenId={}, parentId={}",
                    phase.childrenId(),
                    phase.parentId()
                );
            }

            redisService.delete(anomalyAlertPhaseKey(childrenId));
            startPhaseCoolTime(childrenId);
        } finally {
            releasePhaseLock(childrenId, lockToken.get());
        }
    }

    private void updateAnomalyNotificationActionStatus(
        UUID parentId,
        UUID childrenId,
        Long notificationId,
        AnomalyActionStatus status
    ) {
        Notification notification = notificationRepository.findByIdAndReceiverId(
                notificationId,
                parentId
            )
            .orElseThrow(() -> new CustomException(
                "알림을 찾을 수 없습니다.",
                ErrorCode.NOTIFICATION_NOT_FOUND
            ));

        if (!NotificationCode.RISK_ALERT.name().equals(notification.getNotificationType().getName())) {
            throw new CustomException(
                "알림을 찾을 수 없습니다.",
                ErrorCode.NOTIFICATION_NOT_FOUND
            );
        }

        NotificationPayload payload = notification.getNotificationPayload();
        if (payload == null || !childrenId.equals(payload.getChildrenId())) {
            throw new CustomException(
                "접근 권한이 없습니다.",
                ErrorCode.FORBIDDEN
            );
        }

        notification.markRead();
        notification.markAnomalyActionStatus(status);
    }

    private void requestConversationStartAndFinishPhase(AnomalyAlertPhaseState phase) {
        boolean requested = requestConversationStart(
            phase.childrenId(),
            phase.parentId(),
            phase.correlationId()
        );

        if (!requested) {
            log.debug(
                "Conversation start request already in progress on phase timeout. childrenId={}, parentId={}",
                phase.childrenId(),
                phase.parentId()
            );
        }

        redisService.delete(anomalyAlertPhaseKey(phase.childrenId()));
        startPhaseCoolTime(phase.childrenId());
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
                "해당 보호자가 조작할 수 없는 phase입니다.",
                ErrorCode.FORBIDDEN
            );
        }

        return phase;
    }

    private Optional<String> acquirePhaseLock(UUID childrenId) {
        String token = newPhaseLockToken();

        boolean acquired = redisService.setIfAbsent(
            anomalyAlertPhaseLockKey(childrenId),
            token,
            Duration.ofSeconds(Constants.ANOMALY_ALERT_PHASE_LOCK_TTL_SECONDS)
        );

        return acquired ? Optional.of(token) : Optional.empty();
    }

    private void releasePhaseLock(UUID childrenId, String token) {
        boolean released = redisService.deleteIfValueEquals(
            anomalyAlertPhaseLockKey(childrenId),
            token
        );

        if (!released) {
            log.debug(
                "Phase lock release skipped. lock is owned by another token. childrenId={}",
                childrenId
            );
        }
    }

    private String newPhaseLockToken() {
        return instanceId + ":" + UUID.randomUUID();
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

    private boolean isPhaseCoolTimeActive(UUID childrenId) {
        return redisService.exists(anomalyAlertPhaseCoolTimeKey(childrenId));
    }

    private void startPhaseCoolTime(UUID childrenId) {
        redisService.set(
            anomalyAlertPhaseCoolTimeKey(childrenId),
            "1",
            Duration.ofMinutes(Constants.ANOMALY_ALERT_PHASE_COOL_TIME_MINUTES)
        );
    }

    private String anomalyAlertPhaseKey(UUID childrenId) {
        return Constants.ANOMALY_ALERT_PHASE_KEY_PREFIX + childrenId;
    }

    private String anomalyAlertPhaseLockKey(UUID childrenId) {
        return Constants.ANOMALY_ALERT_PHASE_LOCK_KEY_PREFIX + childrenId;
    }

    private String anomalyAlertPhaseCoolTimeKey(UUID childrenId) {
        return Constants.ANOMALY_ALERT_PHASE_COOL_TIME_KEY_PREFIX + childrenId;
    }

    private LocalDateTime now() {
        return LocalDateTime.now(Constants.SEOUL_ZONE_ID);
    }

    private void sendAnomalyRiskAlert(AnomalyAlertPhaseState phase) {
        log.info("notification-service, anomaly-analysed, RISK_ALERT SENT");

        NotificationPayload payload = NotificationPayload.builder()
            .title("주의 필요")
            .content(String.format(
                "지금 한번 %s에게 관심을 표현해볼까요?",
                phase.childrenName()
            ))
            .childrenId(phase.childrenId())
            .childrenName(phase.childrenName())
            .parentId(phase.parentId())
            .anomalyActionStatus(AnomalyActionStatus.NONE)
            .build();

        notificationAlertSender.send(new NotificationCommand(
            phase.parentId(),
            ReceiverRole.PARENT,
            NotificationCode.RISK_ALERT,
            payload
        ));
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
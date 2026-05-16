package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.event.dto.GpsCheckResultEvent;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertService;
import com.ssafy.rebloom.notification_service.service.AuthServiceResolveService;
import com.ssafy.rebloom.notification_service.service.GpsCheckNotificationService;
import com.ssafy.rebloom.notification_service.service.MqttPublishService;
import com.ssafy.rebloom.notification_service.service.NotificationIdempotencyService;
import com.ssafy.rebloom.notification_service.service.NotificationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GpsCheckNotificationServiceImpl implements GpsCheckNotificationService {

    private final NotificationService notificationService;
    private final AuthServiceResolveService authServiceResolveService;
    private final MqttPublishService mqttPublishService;
    private final NotificationIdempotencyService notificationIdempotencyService;
    private final AnomalyAlertService anomalyAlertService;

    @Override
    @Transactional
    public void handleGpsCheckSame(
        GpsCheckResultEvent event,
        String eventId,
        String correlationId,
        String idempotencyKey
    ) {
        validateSameResult(event);

        String effectiveIdempotencyKey = effectiveIdempotencyKey(idempotencyKey, eventId);
        if (!notificationIdempotencyService.tryStart(effectiveIdempotencyKey, eventId)) {
            log.info(
                "Duplicated GPS same event ignored. eventId={}, idempotencyKey={}",
                eventId,
                effectiveIdempotencyKey
            );
            return;
        }

        try {
            sendConversationStartedAlert(event.parentId(), event.childrenId());

            ChildrenIotInfoResponseDto iotInfo =
                authServiceResolveService.resolveChildrenIotInfo(event.childrenId());

            mqttPublishService.publishConversationStart(iotInfo, correlationId);

            notificationIdempotencyService.markCompleted(effectiveIdempotencyKey);
        } catch (RuntimeException e) {
            anomalyAlertService.releaseConversationLock(event.childrenId());
            notificationIdempotencyService.clear(effectiveIdempotencyKey);
            throw e;
        }
    }

    @Override
    @Transactional
    public void handleGpsCheckDifferent(
        GpsCheckResultEvent event,
        String eventId,
        String correlationId,
        String idempotencyKey
    ) {
        validateDifferentResult(event);

        String effectiveIdempotencyKey = effectiveIdempotencyKey(idempotencyKey, eventId);
        if (!notificationIdempotencyService.tryStart(effectiveIdempotencyKey, eventId)) {
            log.info(
                "Duplicated GPS different event ignored. eventId={}, idempotencyKey={}",
                eventId,
                effectiveIdempotencyKey
            );
            return;
        }

        try {
            sendConversationSkippedAlert(event.parentId(), event.childrenId());
            notificationIdempotencyService.markCompleted(effectiveIdempotencyKey);
        } catch (RuntimeException e) {
            notificationIdempotencyService.clear(effectiveIdempotencyKey);
            throw e;
        }
    }

    private void sendConversationStartedAlert(UUID parentId, UUID childrenId) {
        NotificationPayload payload = NotificationPayload.builder()
            .title("대화를 시작했어요")
            .content("자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.")
            .parentId(parentId)
            .childrenId(childrenId)
            .build();

        notificationService.send(new NotificationCommand(
            parentId,
            ReceiverRole.PARENT,
            NotificationCode.CONVERSATION_ALERT,
            payload
        ));
    }

    private void sendConversationSkippedAlert(UUID parentId, UUID childrenId) {
        NotificationPayload payload = NotificationPayload.builder()
            .title("대화를 시작하지 못했어요")
            .content("자녀의 현재 위치가 집이 아닌 것으로 확인되어 AIoT 대화를 시작하지 않았습니다.")
            .parentId(parentId)
            .childrenId(childrenId)
            .build();

        notificationService.send(new NotificationCommand(
            parentId,
            ReceiverRole.PARENT,
            NotificationCode.CONVERSATION_ALERT,
            payload
        ));
    }

    private void validateSameResult(GpsCheckResultEvent event) {
        if (!Boolean.TRUE.equals(event.isSame())) {
            throw new IllegalArgumentException("GPS same topic event must have same=true.");
        }
        validateRequiredIds(event);
    }

    private void validateDifferentResult(GpsCheckResultEvent event) {
        if (!Boolean.FALSE.equals(event.isSame())) {
            throw new IllegalArgumentException("GPS different topic event must have same=false.");
        }
        validateRequiredIds(event);
    }

    private void validateRequiredIds(GpsCheckResultEvent event) {
        if (event.childrenId() == null || event.parentId() == null) {
            throw new IllegalArgumentException("childrenId and parentId must not be null.");
        }
    }

    private String effectiveIdempotencyKey(String idempotencyKey, String eventId) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            return idempotencyKey;
        }
        return eventId;
    }
}
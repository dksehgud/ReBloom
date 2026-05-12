package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.RealtimeNotificationMessage;
import com.ssafy.rebloom.notification_service.repository.SseEmitterRepository;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationSseService {

    private final SseEmitterRepository sseEmitterRepository;
    private final OnlineStatusService onlineStatusService;

    public SseEmitter connect(UUID userId, String userRole) {
        SseEmitter emitter = new SseEmitter(Constants.SSE_TIMEOUT);

        ReceiverRole receiverRole = getReceiverRole(userRole);

        sseEmitterRepository.save(userId, emitter);
        onlineStatusService.markOnline(userId, receiverRole);

        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(error -> {
            log.debug("SSE emitter error. userId={}", userId, error);
            remove(userId, emitter);
        });

        sendToEmitter(userId, emitter, "connect", "connected");
        return emitter;
    }

    public void send(RealtimeNotificationMessage message) {
        sendToUser(message.receiverId(), "notification", message);
    }

    private void sendToUser(UUID userId, String eventName, Object data) {
        List<SseEmitter> emitters = sseEmitterRepository.findAllByUserId(userId);

        if (emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            sendToEmitter(userId, emitter, eventName, data);
        }
    }

    private void sendToEmitter(UUID userId, SseEmitter emitter, String eventName, Object data) {
        try {
            emitter.send(SseEmitter.event()
                .name(eventName)
                .data(data));
            onlineStatusService.refresh(userId);
        } catch (IOException | IllegalStateException e) {
            log.debug("SSE send failed. userId={}", userId, e);
            remove(userId, emitter);
        }
    }

    private void remove(UUID userId, SseEmitter emitter) {
        sseEmitterRepository.delete(userId, emitter);

        if (!sseEmitterRepository.existsByUserId(userId)) {
            onlineStatusService.markOffline(userId);
        }
    }

    private String normalizeRole(String role) {
        return role != null && role.startsWith("ROLE_")
            ? role.substring("ROLE_".length())
            : role;
    }

    private ReceiverRole getReceiverRole(String userRole) {
        ReceiverRole receiverRole;
        try {
            receiverRole = ReceiverRole.valueOf(normalizeRole(userRole).toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new CustomException("유효하지 않은 사용자 역할입니다.", ErrorCode.USER_ROLE_TYPE_MISMATCH);
        }
        return receiverRole;
    }
}
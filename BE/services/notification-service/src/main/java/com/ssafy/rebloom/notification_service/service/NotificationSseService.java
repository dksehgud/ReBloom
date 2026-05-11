package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.RealtimeNotificationMessage;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
@RequiredArgsConstructor
public class NotificationSseService {

    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final OnlineStatusService onlineStatusService;

    public SseEmitter connect(UUID userId, ReceiverRole role) {
        SseEmitter emitter = new SseEmitter(Constants.SSE_TIMEOUT);
        emitters.put(userId, emitter);
        onlineStatusService.markOnline(userId, role);

        emitter.onCompletion(() -> remove(userId));
        emitter.onTimeout(() -> remove(userId));
        emitter.onError(error -> remove(userId));

        send(userId, "connect", "connected");
        return emitter;
    }

    public void send(RealtimeNotificationMessage message) {
        send(message.receiverId(), "notification", message);
    }

    private void send(UUID userId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                .name(eventName)
                .data(data));
            onlineStatusService.refresh(userId);
        } catch (IOException e) {
            remove(userId);
        }
    }

    private void remove(UUID userId) {
        emitters.remove(userId);
        onlineStatusService.markOffline(userId);
    }
}
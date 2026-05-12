package com.ssafy.rebloom.notification_service.repository.impl;

import com.ssafy.rebloom.notification_service.repository.SseEmitterRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Repository
public class SseEmitterRepositoryImpl implements SseEmitterRepository {

    private final Map<UUID, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    @Override
    public SseEmitter save(UUID userId, SseEmitter emitter) {
        emitters
            .computeIfAbsent(userId, key -> new CopyOnWriteArrayList<>())
            .add(emitter);

        log.debug("SSE emitter saved. userId={}, emitterCount={}", userId, countByUserId(userId));
        return emitter;
    }

    @Override
    public List<SseEmitter> findAllByUserId(UUID userId) {
        return emitters.getOrDefault(userId, List.of());
    }

    @Override
    public void delete(UUID userId, SseEmitter emitter) {
        List<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null) {
            return;
        }

        userEmitters.remove(emitter);

        if (userEmitters.isEmpty()) {
            emitters.remove(userId);
        }

        log.debug("SSE emitter deleted. userId={}, emitterCount={}", userId, countByUserId(userId));
    }

    @Override
    public boolean existsByUserId(UUID userId) {
        List<SseEmitter> userEmitters = emitters.get(userId);
        return userEmitters != null && !userEmitters.isEmpty();
    }

    @Override
    public int countByUserId(UUID userId) {
        return findAllByUserId(userId).size();
    }
}

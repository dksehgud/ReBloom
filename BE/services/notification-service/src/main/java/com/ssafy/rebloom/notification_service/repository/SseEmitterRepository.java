package com.ssafy.rebloom.notification_service.repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface SseEmitterRepository {

    SseEmitter save(UUID userId, SseEmitter emitter);

    List<SseEmitter> findAllByUserId(UUID userId);

    void delete(UUID userId, SseEmitter emitter);

    boolean existsByUserId(UUID userId);

    int countByUserId(UUID userId);

    Map<UUID, List<SseEmitter>> findAll();
}
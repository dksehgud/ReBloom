package com.ssafy.rebloom.event.publisher;

public interface EventPublisher {

    <T> void publish(String topic, String key, String eventType, T payload);

    <T> void publish(String topic, String key, String eventType, String idempotencyKey, T payload);

    <T> void publish(String topic, String key, String eventType, String correlationId, String idempotencyKey, T payload);
}
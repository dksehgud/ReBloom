package com.ssafy.rebloom.event.publisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publish(String topic, String key, Object event) {
        kafkaTemplate.send(topic, key, event).whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Kafka Event Published -> Topic: {}, Key: {}", topic, key);            } else {
                log.error("Failed to publish Kafka Event -> Topic: " + topic + ", Key: " + key, ex);
            }
        });
    }
}
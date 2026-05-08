package com.ssafy.rebloom.event.publisher;

import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.core.EventEnvelope;
import com.ssafy.rebloom.event.core.EventHeaders;
import com.ssafy.rebloom.event.core.EventVersions;
import com.ssafy.rebloom.event.exception.EventPublishException;
import com.ssafy.rebloom.event.support.EventIdGenerator;
import com.ssafy.rebloom.event.support.EventTimeProvider;
import java.nio.charset.StandardCharsets;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KafkaEventPublisher implements EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventPublisher.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final KafkaCommonProperties properties;
    private final EventIdGenerator eventIdGenerator;
    private final EventTimeProvider eventTimeProvider;

    public KafkaEventPublisher(
        KafkaTemplate<String, Object> kafkaTemplate,
        KafkaCommonProperties properties,
        EventIdGenerator eventIdGenerator,
        EventTimeProvider eventTimeProvider
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.properties = properties;
        this.eventIdGenerator = eventIdGenerator;
        this.eventTimeProvider = eventTimeProvider;
    }

    @Override
    public <T> void publish(String topic, String key, String eventType, T payload) {
        publish(topic, key, eventType, null, null, payload);
    }

    @Override
    public <T> void publish(
        String topic,
        String key,
        String eventType,
        String idempotencyKey,
        T payload
    ) {
        publish(topic, key, eventType, null, idempotencyKey, payload);
    }

    @Override
    public <T> void publish(
        String topic,
        String key,
        String eventType,
        String correlationId,
        String idempotencyKey,
        T payload
    ) {
        String eventId = eventIdGenerator.generate();
        String producer = properties.getProducerName();

        EventEnvelope<T> envelope = new EventEnvelope<>(
            eventId,
            eventType,
            EventVersions.V1,
            producer,
            correlationId,
            idempotencyKey,
            eventTimeProvider.now(),
            payload
        );

        ProducerRecord<String, Object> record = new ProducerRecord<>(topic, key, envelope);
        addHeader(record, EventHeaders.EVENT_ID, eventId);
        addHeader(record, EventHeaders.EVENT_TYPE, eventType);
        addHeader(record, EventHeaders.EVENT_VERSION, EventVersions.V1);
        addHeader(record, EventHeaders.PRODUCER, producer);
        addHeader(record, EventHeaders.CORRELATION_ID, correlationId);
        addHeader(record, EventHeaders.IDEMPOTENCY_KEY, idempotencyKey);

        try {
            kafkaTemplate.send(record).get();
            log.info(
                "Published event. topic={}, key={}, eventType={}, eventId={}, correlationId={}",
                topic,
                key,
                eventType,
                eventId,
                correlationId
            );
        } catch (Exception e) {
            throw new EventPublishException(topic, key, eventType, e);
        }
    }

    private void addHeader(ProducerRecord<String, Object> record, String name, String value) {
        if (value == null) {
            return;
        }
        record.headers().add(name, value.getBytes(StandardCharsets.UTF_8));
    }
}
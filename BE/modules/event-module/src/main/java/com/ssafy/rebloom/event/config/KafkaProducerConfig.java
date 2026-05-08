package com.ssafy.rebloom.event.config;

import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(KafkaCommonProperties.class)
public class KafkaProducerConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    private final KafkaCommonProperties properties;

    @Bean
    public ProducerFactory<String, Object> rebloomProducerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.RETRIES_CONFIG, properties.getProducer().getRetries());
        props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, properties.getProducer().getRetryBackoffMs());
        props.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, properties.getProducer().getRequestTimeoutMs());
        props.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, properties.getProducer().getDeliveryTimeoutMs());
        props.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, Object> rebloomKafkaTemplate() {
        return new KafkaTemplate<>(rebloomProducerFactory());
    }
}
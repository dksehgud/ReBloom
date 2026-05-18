package com.ssafy.rebloom.event.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.rebloom.event.core.EventEnvelope;
import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;

@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;
    private final ObjectMapper kafkaObjectMapper;

    public KafkaConsumerConfig(
        @Qualifier("kafkaObjectMapper") ObjectMapper kafkaObjectMapper
    ) {
        this.kafkaObjectMapper = kafkaObjectMapper;
    }

    @Bean
    public ConsumerFactory<String, EventEnvelope<?>> rebloomConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        JsonDeserializer<EventEnvelope<?>> jsonDeserializer = new JsonDeserializer<>(
            EventEnvelope.class,
            kafkaObjectMapper,
            false
        );
        jsonDeserializer.addTrustedPackages("com.ssafy.rebloom.event.*");
        jsonDeserializer.setUseTypeHeaders(false);
        jsonDeserializer.setRemoveTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
            props,
            new ErrorHandlingDeserializer<>(new StringDeserializer()),
            new ErrorHandlingDeserializer<>(jsonDeserializer)
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, EventEnvelope<?>> rebloomKafkaListenerContainerFactory(
        ConsumerFactory<String, EventEnvelope<?>> rebloomConsumerFactory,
        CommonErrorHandler rebloomKafkaErrorHandler
    ) {
        ConcurrentKafkaListenerContainerFactory<String, EventEnvelope<?>> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(rebloomConsumerFactory);
        factory.setCommonErrorHandler(rebloomKafkaErrorHandler);
        return factory;
    }
}
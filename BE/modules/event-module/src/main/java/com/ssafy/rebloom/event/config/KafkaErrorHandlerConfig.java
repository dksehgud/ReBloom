package com.ssafy.rebloom.event.config;

import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import org.apache.kafka.common.TopicPartition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaErrorHandlerConfig {

    @Bean
    public CommonErrorHandler rebloomKafkaErrorHandler(
        KafkaTemplate<String, Object> rebloomKafkaTemplate,
        KafkaCommonProperties properties
    ) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
            rebloomKafkaTemplate,
            (record, exception) -> new TopicPartition(properties.getTopics().getEventDlt(), 0)
        );

        FixedBackOff backOff = new FixedBackOff(
            properties.getConsumer().getRetryIntervalMs(),
            properties.getConsumer().getRetryMaxAttempts()
        );

        return new DefaultErrorHandler(recoverer, backOff);
    }
}
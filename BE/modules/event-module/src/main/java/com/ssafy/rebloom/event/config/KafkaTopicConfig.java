package com.ssafy.rebloom.event.config;

import com.ssafy.rebloom.event.core.EventTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic biometricRawTopic() {
        return TopicBuilder.name(EventTopics.BIOMETRIC_RAW)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic sleepRawTopic() {
        return TopicBuilder.name(EventTopics.SLEEP_RAW)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic biometricAnalysisTopic() {
        return TopicBuilder.name(EventTopics.BIOMETRIC_ANALYSIS)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic anomalyVerifiedTopic() {
        return TopicBuilder.name(EventTopics.ANOMALY_VERIFIED)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic conversationInitiateTopic() {
        return TopicBuilder.name(EventTopics.CONVERSATION_INITIATE)
            .partitions(1)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic analysisReportCompletedTopic() {
        return TopicBuilder.name(EventTopics.ANALYSIS_REPORT_COMPLETED)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic eventDltTopic() {
        return TopicBuilder.name(EventTopics.EVENT_DLT)
            .partitions(1)
            .replicas(1)
            .build();
    }
}
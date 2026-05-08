package com.ssafy.rebloom.event.config.property;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "rebloom.kafka")
public class KafkaCommonProperties {

    private String producerName;

    private KafkaTopicsProperties topics = new KafkaTopicsProperties();

    private KafkaProducerProperties producer = new KafkaProducerProperties();

    private KafkaConsumerProperties consumer = new KafkaConsumerProperties();
}

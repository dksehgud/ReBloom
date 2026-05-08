package com.ssafy.rebloom.event.config.property;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KafkaConsumerProperties {

    private String groupId;
    private Long retryIntervalMs;
    private Long retryMaxAttempts;
}

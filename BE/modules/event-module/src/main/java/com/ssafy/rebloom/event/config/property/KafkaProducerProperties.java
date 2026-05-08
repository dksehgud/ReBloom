package com.ssafy.rebloom.event.config.property;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KafkaProducerProperties {

    private Integer retries;
    private Integer retryBackoffMs;
    private Integer requestTimeoutMs;
    private Integer deliveryTimeoutMs;
}

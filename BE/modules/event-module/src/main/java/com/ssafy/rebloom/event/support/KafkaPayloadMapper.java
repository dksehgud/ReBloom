package com.ssafy.rebloom.event.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class KafkaPayloadMapper {

    private final ObjectMapper objectMapper;

    public KafkaPayloadMapper(
        @Qualifier("kafkaObjectMapper") ObjectMapper objectMapper
    ) {
        this.objectMapper = objectMapper;
    }

    public <T> T convertValue(Object payload, Class<T> targetType) {
        return objectMapper.convertValue(payload, targetType);
    }
}
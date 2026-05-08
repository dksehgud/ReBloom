package com.ssafy.rebloom.intake_service.service.impl;

import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.BiometricDataEvent;
import com.ssafy.rebloom.event.publisher.EventPublisher;
import com.ssafy.rebloom.event.support.EventKeyGenerator;
import com.ssafy.rebloom.intake_service.dto.request.BiometricRawDataRequest;
import com.ssafy.rebloom.intake_service.service.IntakeService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IntakeServiceImpl implements IntakeService {

    private final EventPublisher eventPublisher;
    private final KafkaCommonProperties kafkaProperties;
    private final EventKeyGenerator eventKeyGenerator;
    @Override
    public void ingestBiometricDataEvent(String requestId, UUID userId, BiometricRawDataRequest biometricRawDataRequest) {
        validateUserAccess(userId, biometricRawDataRequest.userId());

        BiometricDataEvent event = biometricRawDataRequest.createEvent();

        String key = biometricRawDataRequest.userId().toString();
        String idempotencyKey = eventKeyGenerator.idempotencyKey(
            EventTypes.BIOMETRIC_DATA_RECEIVED,
            biometricRawDataRequest.userId().toString(),
            biometricRawDataRequest.tsStart().toString()
        );

        eventPublisher.publish(
            kafkaProperties.getTopics().getBiometricRaw(),
            key,
            EventTypes.BIOMETRIC_DATA_RECEIVED,
            requestId,
            idempotencyKey,
            event
        );
    }

    private void validateUserAccess(UUID userId, UUID payloadUserId) {
        if (!userId.equals(payloadUserId)) {
            throw new IllegalArgumentException("Authenticated user does not match payload userId.");
        }
    }
}

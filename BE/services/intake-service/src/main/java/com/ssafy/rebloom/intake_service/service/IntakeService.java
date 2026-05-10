package com.ssafy.rebloom.intake_service.service;

import com.ssafy.rebloom.intake_service.dto.request.BiometricRawDataRequest;
import java.util.UUID;

public interface IntakeService {

    void ingestBiometricDataEvent(String requestId, UUID userId, BiometricRawDataRequest biometricRawDataRequest);
}

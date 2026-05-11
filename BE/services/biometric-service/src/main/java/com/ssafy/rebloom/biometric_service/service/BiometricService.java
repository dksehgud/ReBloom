package com.ssafy.rebloom.biometric_service.service;

import com.ssafy.rebloom.biometric_service.dto.response.BiometricChartResponseDto;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.event.dto.BiometricDataEvent;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public interface BiometricService {
    void save(BiometricDataEvent event, String correlationId);

    void publishAITrainingRequestedEvent(UUID userId, LocalDateTime currentMeasuredAt, String correlationId);

    ListResponseDto<BiometricChartResponseDto> getHrAccRatios(
        UUID userId,
        String role,
        UUID childrenId,
        LocalDate baseDate
    );

    ListResponseDto<BiometricChartResponseDto> getRmssds(
        UUID userId,
        String role,
        UUID childrenId,
        LocalDate baseDate
    );
}

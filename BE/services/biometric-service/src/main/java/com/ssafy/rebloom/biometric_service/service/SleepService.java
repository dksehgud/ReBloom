package com.ssafy.rebloom.biometric_service.service;

import com.ssafy.rebloom.biometric_service.dto.response.SleepChartResponseDto;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.event.dto.SleepDataEvent;
import java.time.LocalDate;
import java.util.UUID;

public interface SleepService {

    void saveSleepRawEvent(SleepDataEvent sleepDataEvent, String correlationId);

    ListResponseDto<SleepChartResponseDto> getSleepScores(
        UUID userId,
        String role,
        UUID childrenId,
        LocalDate baseDate
    );

    ListResponseDto<SleepChartResponseDto> getSleepEfficiencies(
        UUID userId,
        String role,
        UUID childrenId,
        LocalDate baseDate
    );
}

package com.ssafy.rebloom.biometric_service.service;

import com.ssafy.rebloom.biometric_service.dto.response.AnalysisFeatureResponseDto;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public interface AnalysisFeatureService {

    AnalysisFeatureResponseDto getAnalysisFeatures(
        UUID childrenId,
        LocalDate targetDate,
        LocalDateTime referenceDateTime
    );
}

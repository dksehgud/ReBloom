package com.ssafy.rebloom.biometric_service.dto.response;

public record AnalysisFeatureResponseDto(
    Double sleepFeature,
    Double phqFeature,
    boolean hasSleepData,
    boolean hasPhqData
) {
}

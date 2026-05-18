package com.ssafy.rebloom.report_service.analysis.dto.response;

public record BiometricAnalysisFeatureResponse(
    Double sleepFeature,
    Double phqFeature,
    boolean hasSleepData,
    boolean hasPhqData
) {
}

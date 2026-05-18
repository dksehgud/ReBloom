package com.ssafy.rebloom.report_service.analysis.client;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.BiometricAnalysisFeatureResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BiometricAnalysisFeatureClient {

    private final InternalBiometricClient internalBiometricClient;

    public BiometricAnalysisFeatureResponse getAnalysisFeatures(
        UUID childrenId,
        LocalDate targetDate,
        LocalDateTime referenceDateTime
    ) {
        BaseResponse<BiometricAnalysisFeatureResponse> response = internalBiometricClient.getAnalysisFeatures(
            childrenId,
            targetDate,
            referenceDateTime
        );
        return response.getData();
    }
}

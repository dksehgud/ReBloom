package com.ssafy.rebloom.report_service.analysis.client;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.BiometricAnalysisFeatureResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "biometric-service", url = "${rebloom.client.biometric-service-url}")
public interface InternalBiometricClient {

    @GetMapping("/api/v1/internal/children/{childrenId}/analysis-features")
    BaseResponse<BiometricAnalysisFeatureResponse> getAnalysisFeatures(
        @PathVariable UUID childrenId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime referenceDateTime
    );
}

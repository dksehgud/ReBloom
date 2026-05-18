package com.ssafy.rebloom.biometric_service.controller;

import com.ssafy.rebloom.biometric_service.dto.response.AnalysisFeatureResponseDto;
import com.ssafy.rebloom.biometric_service.service.AnalysisFeatureService;
import com.ssafy.rebloom.common.dto.BaseResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/internal/children/{childrenId}/analysis-features")
public class InternalAnalysisFeatureController {

    private final AnalysisFeatureService analysisFeatureService;

    @GetMapping
    public ResponseEntity<BaseResponse<AnalysisFeatureResponseDto>> getAnalysisFeatures(
        @PathVariable UUID childrenId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime referenceDateTime
    ) {
        AnalysisFeatureResponseDto response = analysisFeatureService.getAnalysisFeatures(
            childrenId,
            targetDate,
            referenceDateTime
        );
        return ResponseEntity.ok(BaseResponse.success("analysis features retrieved", response));
    }
}

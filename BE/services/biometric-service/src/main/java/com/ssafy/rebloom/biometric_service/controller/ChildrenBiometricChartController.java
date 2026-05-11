package com.ssafy.rebloom.biometric_service.controller;

import com.ssafy.rebloom.biometric_service.dto.response.BiometricChartResponseDto;
import com.ssafy.rebloom.biometric_service.service.BiometricService;
import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import com.ssafy.rebloom.security.annotation.LoginUserRole;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/children/{childrenId}/charts/biometrics")
public class ChildrenBiometricChartController {

    private final BiometricService biometricService;

    @GetMapping("/hr-acc-ratios")
    @PreAuthorize("hasAnyRole('PARENT', 'COUNSELOR')")
    public ResponseEntity<BaseResponse<ListResponseDto<BiometricChartResponseDto>>> getHrAccRatios(
        @LoginUserId UUID userId,
        @LoginUserRole String role,
        @PathVariable UUID childrenId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baseDate
    ) {
        ListResponseDto<BiometricChartResponseDto> response = biometricService.getHrAccRatios(
            userId,
            role,
            childrenId,
            baseDate
        );

        return ResponseEntity.ok(BaseResponse.success("행동 활성 차트 조회 성공", response));
    }

    @GetMapping("/rmssds")
    @PreAuthorize("hasAnyRole('PARENT', 'COUNSELOR')")
    public ResponseEntity<BaseResponse<ListResponseDto<BiometricChartResponseDto>>> getRmssds(
        @LoginUserId UUID userId,
        @LoginUserRole String role,
        @PathVariable UUID childrenId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baseDate
    ) {
        ListResponseDto<BiometricChartResponseDto> response = biometricService.getRmssds(
            userId,
            role,
            childrenId,
            baseDate
        );

        return ResponseEntity.ok(BaseResponse.success("자율 신경 안정도 차트 조회 성공", response));
    }
}
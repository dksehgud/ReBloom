package com.ssafy.rebloom.biometric_service.controller;

import com.ssafy.rebloom.biometric_service.dto.response.SleepChartResponseDto;
import com.ssafy.rebloom.biometric_service.service.SleepService;
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
@RequestMapping("/api/v1/children/{childrenId}/charts")
public class ChildSleepController {

    private final SleepService sleepService;

    @GetMapping("/sleep-scores")
    @PreAuthorize("hasAnyRole('PARENT', 'COUNSELOR')")
    public ResponseEntity<BaseResponse<ListResponseDto<SleepChartResponseDto>>> getSleepScores(
        @LoginUserId UUID userId,
        @LoginUserRole String role,
        @PathVariable UUID childrenId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baseDate
    ) {

        ListResponseDto<SleepChartResponseDto> response = sleepService.getSleepScores(
            userId,
            role,
            childrenId,
            baseDate
        );
        return ResponseEntity.ok(BaseResponse.success("수면 점수 차트 조회 성공", response));
    }

    @GetMapping("/sleep-efficiencies")
    @PreAuthorize("hasRole('COUNSELOR')")
    public ResponseEntity<BaseResponse<ListResponseDto<SleepChartResponseDto>>> getSleepEfficiencies(
        @LoginUserId UUID userId,
        @LoginUserRole String role,
        @PathVariable UUID childrenId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baseDate
    ) {

        ListResponseDto<SleepChartResponseDto> sleepEfficienciesResponses = sleepService.getSleepEfficiencies(
            userId,
            role,
            childrenId,
            baseDate
        );
        return ResponseEntity.ok(BaseResponse.success("수면 효율 차트 조회 성공", sleepEfficienciesResponses));
    }

}

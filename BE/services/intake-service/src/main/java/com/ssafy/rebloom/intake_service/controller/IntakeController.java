package com.ssafy.rebloom.intake_service.controller;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.intake_service.dto.request.BiometricRawDataRequest;
import com.ssafy.rebloom.intake_service.service.IntakeService;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import com.ssafy.rebloom.security.annotation.RequestId;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController("/api/v1/intakes")
public class IntakeController {

    private final IntakeService intakeService;

    @PostMapping("/biometrics/raw")
    @PreAuthorize("hasRole('CHILDREN')")
    public ResponseEntity<BaseResponse<Void>> ingestBiometric(
        @RequestId String requestId,
        @LoginUserId UUID loginUserId,
        @Valid @RequestBody BiometricRawDataRequest biometricRawDataRequest
    ) {
        intakeService.ingestBiometricDataEvent(requestId, loginUserId, biometricRawDataRequest);
        return ResponseEntity
            .accepted()
            .body(BaseResponse.success("생체 데이터 전송 성공"));
    }
}

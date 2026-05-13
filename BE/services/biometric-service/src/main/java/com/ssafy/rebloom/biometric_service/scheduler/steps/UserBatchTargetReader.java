package com.ssafy.rebloom.biometric_service.scheduler.steps;

import com.ssafy.rebloom.biometric_service.repository.BiometricRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserBatchTargetReader {

    private final BiometricRepository biometricRepository;

    public List<UUID> findTargetUserIds() {
        return biometricRepository.findDistinctUserIds();
    }
}

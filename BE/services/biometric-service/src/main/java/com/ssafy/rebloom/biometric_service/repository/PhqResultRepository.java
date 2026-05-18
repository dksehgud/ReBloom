package com.ssafy.rebloom.biometric_service.repository;

import com.ssafy.rebloom.biometric_service.domain.entity.PhqResult;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhqResultRepository extends JpaRepository<PhqResult, Long> {

    Optional<PhqResult> findTopByUserIdAndDateOrderByPredictedAtDesc(UUID userId, LocalDate date);
}

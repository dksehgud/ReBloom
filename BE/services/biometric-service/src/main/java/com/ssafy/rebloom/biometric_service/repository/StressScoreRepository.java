package com.ssafy.rebloom.biometric_service.repository;

import com.ssafy.rebloom.biometric_service.domain.entity.StressScore;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StressScoreRepository extends JpaRepository<StressScore, Long> {
}

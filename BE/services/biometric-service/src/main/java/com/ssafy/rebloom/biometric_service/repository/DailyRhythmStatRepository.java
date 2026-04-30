package com.ssafy.rebloom.biometric_service.repository;

import com.ssafy.rebloom.biometric_service.domain.entity.DailyRhythmStat;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyRhythmStatRepository extends JpaRepository<DailyRhythmStat, Long> {
}
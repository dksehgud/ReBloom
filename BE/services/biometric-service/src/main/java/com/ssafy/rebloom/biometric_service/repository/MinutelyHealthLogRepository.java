package com.ssafy.rebloom.biometric_service.repository;

import com.ssafy.rebloom.biometric_service.domain.entity.MinutelyHealthLog;
import com.ssafy.rebloom.biometric_service.domain.entity.MinutelyHealthLogId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MinutelyHealthLogRepository extends JpaRepository<MinutelyHealthLog, MinutelyHealthLogId> {
}
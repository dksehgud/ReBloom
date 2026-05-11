package com.ssafy.rebloom.biometric_service.repository;

import com.ssafy.rebloom.biometric_service.domain.entity.Sleep;
import com.ssafy.rebloom.biometric_service.domain.entity.SleepId;
import com.ssafy.rebloom.biometric_service.repository.query.SleepQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SleepRepository extends JpaRepository<Sleep, SleepId>, SleepQueryRepository {

}
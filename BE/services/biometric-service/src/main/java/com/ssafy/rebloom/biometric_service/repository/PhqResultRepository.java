package com.ssafy.rebloom.biometric_service.repository;

import com.ssafy.rebloom.biometric_service.domain.entity.PhqResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhqResultRepository extends JpaRepository<PhqResult, Long> {

}
package com.ssafy.rebloom.biometric_service.repository;

import com.ssafy.rebloom.biometric_service.domain.entity.Biometric;
import com.ssafy.rebloom.biometric_service.domain.entity.BiometricId;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BiometricRepository extends JpaRepository<Biometric, BiometricId> {

    @Query("SELECT b FROM Biometric b " +
        "WHERE b.id.userId = :userId " +
        "AND b.id.tsStart BETWEEN :from AND :to " +
        "ORDER BY b.id.tsStart ASC")
    List<Biometric> findBiometricsInRange(
        @Param("userId") UUID userId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );}
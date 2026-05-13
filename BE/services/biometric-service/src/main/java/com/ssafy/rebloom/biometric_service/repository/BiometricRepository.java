package com.ssafy.rebloom.biometric_service.repository;

import com.ssafy.rebloom.biometric_service.domain.entity.Biometric;
import com.ssafy.rebloom.biometric_service.domain.entity.BiometricId;
import com.ssafy.rebloom.biometric_service.dto.query.DailyMetric;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BiometricRepository extends JpaRepository<Biometric, BiometricId> {

    @Query("SELECT DISTINCT b.id.userId FROM Biometric b")
    List<UUID> findDistinctUserIds();

    @Query("SELECT b FROM Biometric b " +
        "WHERE b.id.userId = :userId " +
        "AND b.id.tsStart BETWEEN :from AND :to " +
        "ORDER BY b.id.tsStart ASC")
    List<Biometric> findBiometricsInRange(
        @Param("userId") UUID userId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );

    @Query("SELECT b FROM Biometric b " +
        "WHERE b.id.userId = :userId " +
        "ORDER BY b.id.tsStart ASC")
    List<Biometric> findAllByUserIdOrderByTsStart(@Param("userId") UUID userId);

    @Query(value = """
        SELECT CAST(b.ts_start AS date) AS date,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY b.hr_acc_ratio) AS value
        FROM biometrics b
        WHERE b.user_id = :childrenId
          AND b.ts_start >= :from
          AND b.ts_start < :to
          AND b.hr_acc_ratio IS NOT NULL
        GROUP BY CAST(b.ts_start AS date)
        ORDER BY CAST(b.ts_start AS date)
        """, nativeQuery = true)
    List<DailyMetric> findDailyHrAccRatioMediansByRange(
        @Param("childrenId") UUID childrenId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );

    @Query(value = """
        SELECT CAST(b.ts_start AS date) AS date,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY b.rmssd) AS value
        FROM biometrics b
        WHERE b.user_id = :childrenId
          AND b.ts_start >= :from
          AND b.ts_start < :to
          AND b.rmssd IS NOT NULL
        GROUP BY CAST(b.ts_start AS date)
        ORDER BY CAST(b.ts_start AS date)
        """, nativeQuery = true)
    List<DailyMetric> findDailyRmssdMediansByRange(
        @Param("childrenId") UUID childrenId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );
}

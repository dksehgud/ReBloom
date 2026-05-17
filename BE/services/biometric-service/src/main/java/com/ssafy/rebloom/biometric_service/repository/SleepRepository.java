package com.ssafy.rebloom.biometric_service.repository;

import com.ssafy.rebloom.biometric_service.domain.entity.Sleep;
import com.ssafy.rebloom.biometric_service.domain.entity.SleepId;
import com.ssafy.rebloom.biometric_service.repository.query.SleepQueryRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SleepRepository extends JpaRepository<Sleep, SleepId>, SleepQueryRepository {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        UPDATE sleeps
        SET is_main_sleep = false
        WHERE user_id = :userId
          AND wakeup >= :from
          AND wakeup < :to
        """, nativeQuery = true)
    int clearMainSleepInWindow(@Param("userId") UUID userId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        UPDATE sleeps
        SET is_main_sleep = true
        WHERE user_id = :userId
          AND wakeup = (
              SELECT wakeup
              FROM sleeps
              WHERE user_id = :userId
                AND wakeup >= :from
                AND wakeup < :to
              ORDER BY sleep_duration DESC NULLS LAST, wakeup ASC
              LIMIT 1
          )
        """, nativeQuery = true)
    int markLongestSleepAsMainInWindow(@Param("userId") UUID userId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT MIN(s.id.wakeup) FROM Sleep s WHERE s.id.userId = :userId")
    Optional<LocalDateTime> findFirstWakeup(@Param("userId") UUID userId);

    @Query("SELECT s FROM Sleep s " +
        "WHERE s.id.userId = :userId " +
        "AND s.id.wakeup >= :from " +
        "AND s.isMainSleep = true " +
        "ORDER BY s.id.wakeup ASC")
    List<Sleep> findMainSleepsFrom(
        @Param("userId") UUID userId,
        @Param("from") LocalDateTime from
    );

    @Query("SELECT s FROM Sleep s " +
           "WHERE s.id.userId = :userId " +
           "AND s.id.wakeup >= :from " +
           "AND s.id.wakeup < :to " +
           "AND s.isMainSleep = true " +
           "ORDER BY s.id.wakeup ASC")
    List<Sleep> findMainSleepsInRange(
        @Param("userId") UUID userId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );
}

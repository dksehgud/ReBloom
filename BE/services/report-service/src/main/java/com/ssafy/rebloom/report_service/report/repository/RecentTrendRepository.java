package com.ssafy.rebloom.report_service.report.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.rebloom.report_service.report.entity.RecentTrend;
import com.ssafy.rebloom.report_service.report.entity.RecentTrendId;

public interface RecentTrendRepository extends JpaRepository<RecentTrend, RecentTrendId> {

    @Query(value = """
            SELECT *
            FROM recent_trend
            WHERE user_id = :userId
            ORDER BY report_date DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<RecentTrend> findLatestByUserId(@Param("userId") UUID userId);
}


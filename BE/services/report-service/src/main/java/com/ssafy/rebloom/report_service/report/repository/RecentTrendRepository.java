package com.ssafy.rebloom.report_service.report.repository;

import com.ssafy.rebloom.report_service.report.domain.entity.RecentTrend;
import com.ssafy.rebloom.report_service.report.domain.entity.RecentTrendId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;


public interface RecentTrendRepository extends JpaRepository<RecentTrend, RecentTrendId> {

    @Query(value = """
        SELECT id,
               user_id,
               report_date,
               summary
        FROM recent_trend
        WHERE user_id = :userId
        ORDER BY report_date DESC
        LIMIT 1
        """, nativeQuery = true)
    Optional<RecentTrend> findLatestByUserId(@Param("userId") UUID userId);
}


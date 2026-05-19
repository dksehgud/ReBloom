package com.ssafy.rebloom.report_service.analysis.repository;

import com.ssafy.rebloom.report_service.analysis.domain.entity.DiaryAnalysis;
import com.ssafy.rebloom.report_service.analysis.domain.entity.DiaryAnalysisId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


public interface DiaryAnalysisRepository extends JpaRepository<DiaryAnalysis, DiaryAnalysisId> {

    @Query(value = """
        SELECT id
        FROM diary_analysis
        WHERE user_id = :userId
          AND target_date = :targetDate
        """, nativeQuery = true)
    List<UUID> findAnalysisIdsByUserIdAndTargetDate(
        @Param("userId") UUID userId,
        @Param("targetDate") LocalDateTime targetDate
    );

    @Modifying
    @Query(value = """
        DELETE FROM diary_analysis
        WHERE user_id = :userId
          AND target_date = :targetDate
        """, nativeQuery = true)
    void deleteByUserIdAndTargetDate(
        @Param("userId") UUID userId,
        @Param("targetDate") LocalDateTime targetDate
    );

    @Query(value = """
        SELECT id,
               user_id,
               target_date,
               emotion_icon,
               embedding_text,
               prediction,
               created_at,
               modified_at
        FROM diary_analysis
        WHERE user_id = :userId
          AND target_date BETWEEN :startDate AND :endDate
        ORDER BY target_date ASC
        """, nativeQuery = true)
    List<DiaryAnalysis> findByPeriod(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}


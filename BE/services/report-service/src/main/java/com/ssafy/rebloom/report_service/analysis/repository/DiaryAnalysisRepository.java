package com.ssafy.rebloom.report_service.analysis.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.rebloom.report_service.analysis.entity.DiaryAnalysis;
import com.ssafy.rebloom.report_service.analysis.entity.DiaryAnalysisId;

public interface DiaryAnalysisRepository extends JpaRepository<DiaryAnalysis, DiaryAnalysisId> {

    @Query("""
            SELECT da
            FROM DiaryAnalysis da
            WHERE da.id.userId = :userId
              AND da.targetDate BETWEEN :startDate AND :endDate
            ORDER BY da.targetDate ASC
            """)
    List<DiaryAnalysis> findByPeriod(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}


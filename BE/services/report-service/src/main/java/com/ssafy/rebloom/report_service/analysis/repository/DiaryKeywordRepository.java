package com.ssafy.rebloom.report_service.analysis.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.rebloom.report_service.analysis.entity.DiaryKeyword;
import com.ssafy.rebloom.report_service.analysis.entity.DiaryKeywordId;

public interface DiaryKeywordRepository extends JpaRepository<DiaryKeyword, DiaryKeywordId> {

    @Query("""
            SELECT dk
            FROM DiaryKeyword dk
            JOIN FETCH dk.analysisKeyword
            WHERE dk.id.userId = :userId
              AND dk.id.analysisId IN :analysisIds
            """)
    List<DiaryKeyword> findByAnalysisIds(
            @Param("userId") UUID userId,
            @Param("analysisIds") Collection<UUID> analysisIds
    );
}


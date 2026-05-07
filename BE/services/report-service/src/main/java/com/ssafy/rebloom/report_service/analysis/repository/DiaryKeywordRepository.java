package com.ssafy.rebloom.report_service.analysis.repository;

import com.ssafy.rebloom.report_service.analysis.domain.entity.DiaryKeyword;
import com.ssafy.rebloom.report_service.analysis.domain.entity.DiaryKeywordId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface DiaryKeywordRepository extends JpaRepository<DiaryKeyword, DiaryKeywordId> {

    @Query(value = """
        SELECT dk.analysis_id AS analysisId,
               ak.keyword AS keyword
        FROM diary_keywords dk
        JOIN analysis_keywords ak
          ON ak.keyword_id = dk.keyword_id
        WHERE dk.user_id = :userId
          AND dk.analysis_id IN (:analysisIds)
        """, nativeQuery = true)
    List<KeywordProjection> findKeywordsByUserIdAndAnalysisIds(
        @Param("userId") UUID userId,
        @Param("analysisIds") Collection<UUID> analysisIds
    );
}

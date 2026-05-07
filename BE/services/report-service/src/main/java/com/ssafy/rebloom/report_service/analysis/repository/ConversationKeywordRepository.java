package com.ssafy.rebloom.report_service.analysis.repository;

import com.ssafy.rebloom.report_service.analysis.domain.entity.ConversationKeyword;
import com.ssafy.rebloom.report_service.analysis.domain.entity.ConversationKeywordId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ConversationKeywordRepository extends JpaRepository<ConversationKeyword, ConversationKeywordId> {

    @Query(value = """
        SELECT ck.analysis_id AS analysisId,
               ak.keyword AS keyword
        FROM conversation_keywords ck
        JOIN analysis_keywords ak
          ON ak.keyword_id = ck.keyword_id
        WHERE ck.user_id = :userId
          AND ck.analysis_id IN (:analysisIds)
        """, nativeQuery = true)
    List<KeywordProjection> findKeywordsByUserIdAndAnalysisIds(
        @Param("userId") UUID userId,
        @Param("analysisIds") Collection<UUID> analysisIds
    );
}

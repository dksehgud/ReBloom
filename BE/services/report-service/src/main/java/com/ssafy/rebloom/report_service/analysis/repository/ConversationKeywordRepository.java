package com.ssafy.rebloom.report_service.analysis.repository;

import com.ssafy.rebloom.report_service.analysis.entity.ConversationKeyword;
import com.ssafy.rebloom.report_service.analysis.entity.ConversationKeywordId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ConversationKeywordRepository extends JpaRepository<ConversationKeyword, ConversationKeywordId> {

    @Query("""
        SELECT ck
        FROM ConversationKeyword ck
        JOIN FETCH ck.analysisKeyword
        WHERE ck.id.userId = :userId
          AND ck.id.analysisId IN :analysisIds
        """)
    List<ConversationKeyword> findByAnalysisIds(
        @Param("userId") UUID userId,
        @Param("analysisIds") Collection<UUID> analysisIds
    );
}


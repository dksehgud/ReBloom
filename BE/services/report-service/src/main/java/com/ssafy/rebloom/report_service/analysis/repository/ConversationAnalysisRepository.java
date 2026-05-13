package com.ssafy.rebloom.report_service.analysis.repository;

import com.ssafy.rebloom.report_service.analysis.domain.entity.ConversationAnalysisId;
import com.ssafy.rebloom.report_service.analysis.domain.entity.ConversationAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ConversationAnalysisRepository extends JpaRepository<ConversationAnalysis, ConversationAnalysisId> {

    @Query(value = """
        SELECT id,
               user_id,
               started_at,
               ended_at,
               embedding_text,
               prediction,
               is_ai_initiated,
               created_at,
               modified_at
        FROM conversation_analysis
        WHERE user_id = :userId
          AND started_at BETWEEN :startDateTime AND :endDateTime
        ORDER BY started_at ASC
        """, nativeQuery = true)
    List<ConversationAnalysis> findByPeriod(
        @Param("userId") UUID userId,
        @Param("startDateTime") LocalDateTime startDateTime,
        @Param("endDateTime") LocalDateTime endDateTime
    );
}

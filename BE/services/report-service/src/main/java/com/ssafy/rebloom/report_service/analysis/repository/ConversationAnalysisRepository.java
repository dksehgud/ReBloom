package com.ssafy.rebloom.report_service.analysis.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.rebloom.report_service.analysis.entity.ConversationAnalysis;
import com.ssafy.rebloom.report_service.analysis.entity.ConversationAnalysisId;

public interface ConversationAnalysisRepository extends JpaRepository<ConversationAnalysis, ConversationAnalysisId> {

    @Query("""
            SELECT ca
            FROM ConversationAnalysis ca
            WHERE ca.id.userId = :userId
              AND ca.startedAt BETWEEN :startDateTime AND :endDateTime
            ORDER BY ca.startedAt ASC
            """)
    List<ConversationAnalysis> findByPeriod(
            @Param("userId") UUID userId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );
}


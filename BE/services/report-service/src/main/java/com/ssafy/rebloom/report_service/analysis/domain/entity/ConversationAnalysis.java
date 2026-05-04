package com.ssafy.rebloom.report_service.analysis.entity;

import java.time.LocalDateTime;

import com.ssafy.rebloom.common.entity.BaseTime;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Builder
@Table(name = "conversation_analysis")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ConversationAnalysis extends BaseTime {

    @EmbeddedId
    private ConversationAnalysisId id;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at", nullable = false)
    private LocalDateTime endedAt;

    @Column(name = "sentiment_label", nullable = false)
    private String sentimentLabel;

    @Column(nullable = false)
    private String summary;

    @Column(name = "depression_score", nullable = false)
    private Float depressionScore;
}


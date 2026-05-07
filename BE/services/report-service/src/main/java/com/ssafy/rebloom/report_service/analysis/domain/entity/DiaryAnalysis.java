package com.ssafy.rebloom.report_service.analysis.domain.entity;

import com.ssafy.rebloom.common.entity.BaseTime;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Entity
@Builder
@Table(name = "diary_analysis")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class DiaryAnalysis extends BaseTime {

    @EmbeddedId
    private DiaryAnalysisId id;

    @Column(name = "target_date", nullable = false)
    private LocalDateTime targetDate;

    @Column(name = "emotion_icon", nullable = false)
    private String emotionIcon;

    @Column(name = "embedding_text", nullable = false)
    private String embeddingText;

    @Column(nullable = false)
    private String prediction;
}


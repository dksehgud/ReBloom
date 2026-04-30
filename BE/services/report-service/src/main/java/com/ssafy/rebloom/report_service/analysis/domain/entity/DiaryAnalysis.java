package com.ssafy.rebloom.report_service.analysis.entity;

import java.time.LocalDate;

import com.ssafy.rebloom.common.entity.BaseTime;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "diary_analysis")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DiaryAnalysis extends BaseTime {

    @EmbeddedId
    private DiaryAnalysisId id;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(name = "sentiment_label", nullable = false)
    private String sentimentLabel;

    @Column(nullable = false)
    private String summary;

    @Column(name = "depression_score", nullable = false)
    private Float depressionScore;
}

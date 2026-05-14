package com.ssafy.rebloom.report_service.analysis.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDate;

@Getter
@Entity
@Builder
@Table(name = "recent_trend")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class RecentTrend {

    @EmbeddedId
    private RecentTrendId id;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(nullable = false)
    private String summary;

    public void updateSummary(String summary) {
        this.summary = summary;
    }
}


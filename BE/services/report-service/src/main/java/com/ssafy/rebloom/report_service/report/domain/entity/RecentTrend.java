package com.ssafy.rebloom.report_service.report.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "recent_trend")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecentTrend {

    @EmbeddedId
    private RecentTrendId id;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(nullable = false)
    private String summary;
}

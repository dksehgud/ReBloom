package com.ssafy.rebloom.report_service.analysis.entity;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Embeddable
@EqualsAndHashCode
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DiaryKeywordId implements Serializable {

    @Column(name = "keyword_id", nullable = false)
    private Integer keywordId;

    @Column(name = "analysis_id", nullable = false)
    private UUID analysisId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;
}


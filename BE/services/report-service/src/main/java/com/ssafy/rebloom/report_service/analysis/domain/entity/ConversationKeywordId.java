package com.ssafy.rebloom.report_service.analysis.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Embeddable
@EqualsAndHashCode
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConversationKeywordId implements Serializable {

    @Column(name = "keyword_id", nullable = false)
    private Integer keywordId;

    @Column(name = "analysis_id", nullable = false)
    private UUID analysisId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;
}


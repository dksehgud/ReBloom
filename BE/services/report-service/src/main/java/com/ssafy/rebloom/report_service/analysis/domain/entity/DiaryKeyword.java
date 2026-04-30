package com.ssafy.rebloom.report_service.analysis.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinColumns;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Builder
@Table(name = "diary_keywords")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class DiaryKeyword {

    // (keyword_id, analysis_id, user_id) 복합 PK
    @EmbeddedId
    private DiaryKeywordId id;

    // 여러 diary_keywords 행이 하나의 diary_analysis를 참조한다.
    // FK가 EmbeddedId 안에 있으므로 insert/update 충돌을 막기 위해 읽기 전용으로 둔다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "analysis_id", referencedColumnName = "id", insertable = false, updatable = false),
            @JoinColumn(name = "user_id", referencedColumnName = "user_id", insertable = false, updatable = false)
    })
    private DiaryAnalysis diaryAnalysis;

    // 여러 diary_keywords 행이 하나의 키워드 사전 항목을 참조한다.
    // keyword_id도 EmbeddedId에 있으므로 읽기 전용 매핑이다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "keyword_id", referencedColumnName = "keyword_id", insertable = false, updatable = false)
    private AnalysisKeyword analysisKeyword;
}

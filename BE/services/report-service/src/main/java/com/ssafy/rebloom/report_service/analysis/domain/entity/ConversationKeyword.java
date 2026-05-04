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
@Table(name = "conversation_keywords")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ConversationKeyword {

    @EmbeddedId
    private ConversationKeywordId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "analysis_id", referencedColumnName = "id", insertable = false, updatable = false),
            @JoinColumn(name = "user_id", referencedColumnName = "user_id", insertable = false, updatable = false)
    })
    private ConversationAnalysis conversationAnalysis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "keyword_id", referencedColumnName = "keyword_id", insertable = false, updatable = false)
    private AnalysisKeyword analysisKeyword;
}


package com.ssafy.rebloom.report_service.analysis.domain.entity;

import jakarta.persistence.*;
import lombok.*;

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


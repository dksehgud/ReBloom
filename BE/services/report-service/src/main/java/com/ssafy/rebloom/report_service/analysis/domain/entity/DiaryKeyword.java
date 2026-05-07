package com.ssafy.rebloom.report_service.analysis.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Entity
@Builder
@Table(name = "diary_keywords")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class DiaryKeyword {

    // (keyword_id, analysis_id, user_id) 蹂듯빀 PK
    @EmbeddedId
    private DiaryKeywordId id;

    // ?щ윭 diary_keywords ?됱씠 ?섎굹??diary_analysis瑜?李몄“?쒕떎.
    // FK媛 EmbeddedId ?덉뿉 ?덉쑝誘濡?insert/update 異⑸룎??留됯린 ?꾪빐 ?쎄린 ?꾩슜?쇰줈 ?붾떎.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
        @JoinColumn(name = "analysis_id", referencedColumnName = "id", insertable = false, updatable = false),
        @JoinColumn(name = "user_id", referencedColumnName = "user_id", insertable = false, updatable = false)
    })
    private DiaryAnalysis diaryAnalysis;

    // ?щ윭 diary_keywords ?됱씠 ?섎굹???ㅼ썙???ъ쟾 ??ぉ??李몄“?쒕떎.
    // keyword_id??EmbeddedId???덉쑝誘濡??쎄린 ?꾩슜 留ㅽ븨?대떎.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "keyword_id", referencedColumnName = "keyword_id", insertable = false, updatable = false)
    private AnalysisKeyword analysisKeyword;
}


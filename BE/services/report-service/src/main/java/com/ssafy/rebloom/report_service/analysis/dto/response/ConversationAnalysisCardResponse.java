package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
// ???遺꾩꽍 移대뱶 ?묐떟 DTO
public class ConversationAnalysisCardResponse {

    // conversation_analysis ID
    private UUID analysisId;

    // ????쒖옉 ?쒓컖
    private LocalDateTime startedAt;

    // ???醫낅즺 ?쒓컖
    private LocalDateTime endedAt;

    // 媛먯젙 遺꾩꽍 ?쇰꺼
    private String sentimentLabel;

    // 遺꾩꽍 ?붿빟 ?댁슜
    private String summary;

    // ?대떦 遺꾩꽍???곗슱 ?먯닔
    private Float depressionScore;

    // ?대떦 遺꾩꽍???곌껐???ㅼ썙??紐⑸줉
    private List<String> keywords;
}


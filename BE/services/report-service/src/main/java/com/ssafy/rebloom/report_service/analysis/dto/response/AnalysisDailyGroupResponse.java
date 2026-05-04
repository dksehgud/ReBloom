package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDate;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
// ?섎（ ?⑥쐞濡?臾띠? ?쇨린/???遺꾩꽍 移대뱶 洹몃９ ?묐떟 DTO
public class AnalysisDailyGroupResponse {

    // 移대뱶媛 ?랁븳 ?좎쭨
    private LocalDate date;

    // ?붾㈃???쒖떆???붿씪
    private String dayOfWeek;

    // ?대떦 ?좎쭨???쇨린 遺꾩꽍 移대뱶 紐⑸줉
    private List<DiaryAnalysisCardResponse> diaryCards;

    // ?대떦 ?좎쭨?????遺꾩꽍 移대뱶 紐⑸줉
    private List<ConversationAnalysisCardResponse> conversationCards;
}


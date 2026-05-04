package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDate;
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
// 理쒓렐 ?쒗쁽 遺꾩꽍 ?붾㈃ 議고쉶 ?묐떟 DTO
public class ExpressionAnalysisResponse {

    // 遺꾩꽍 ????ъ슜??ID
    private UUID userId;

    // 議고쉶 二쇱감 ?쒖옉??    private LocalDate weekStartDate;

    // 議고쉶 二쇱감 醫낅즺??    private LocalDate weekEndDate;

    // ?붾㈃???쒖떆??二쇱감 ?쇰꺼
    private String weekLabel;

    // 二쇨컙 ?곗슱 ?먯닔 洹몃옒???곗씠??    private List<DepressionScorePointResponse> depressionScores;

    // ?좎쭨蹂??쇨린/???遺꾩꽍 移대뱶 紐⑸줉
    private List<AnalysisDailyGroupResponse> dailyGroups;
}


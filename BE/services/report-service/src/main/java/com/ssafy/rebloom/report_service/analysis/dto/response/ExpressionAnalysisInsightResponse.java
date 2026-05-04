package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDateTime;
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
// 理쒓렐 ?쒗쁽 遺꾩꽍 AI ?몄궗?댄듃 ?앹꽦 ?묐떟 DTO
public class ExpressionAnalysisInsightResponse {

    // 遺꾩꽍 ????ъ슜??ID
    private UUID userId;

    // AI 異붾줎 ?먮뒗 理쒖떊 ??κ컪?쇰줈 諛섑솚???몄궗?댄듃
    private String insight;

    // ?몄궗?댄듃 ?앹꽦 ?쒓컖
    private LocalDateTime generatedAt;
}


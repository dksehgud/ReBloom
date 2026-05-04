package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.time.LocalDate;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
// ?곗슱 ?먯닔 洹몃옒?꾩쓽 ??吏???묐떟 DTO
public class DepressionScorePointResponse {

    // ?먯닔媛 吏묎퀎??湲곗? ?좎쭨
    private LocalDate date;

    // 洹몃옒??異뺤뿉 ?쒖떆???쇰꺼
    private String label;

    // ?쇨린 遺꾩꽍 湲곕컲 ?곗슱 ?먯닔
    private Float diaryScore;

    // ???遺꾩꽍 湲곕컲 ?곗슱 ?먯닔
    private Float conversationScore;

    // ?쇨린/????먯닔瑜??⑹궛??????먯닔
    private Float averageScore;
}


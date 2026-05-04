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
// ?쇨린/???媛먯젙 ?먮쫫 李⑦듃 怨듯넻 ?묐떟 DTO
public class ChartResponse {

    // 遺꾩꽍 ????ъ슜??ID
    private UUID userId;

    // 議고쉶 ?쒖옉??    private LocalDate startDate;

    // 議고쉶 醫낅즺??    private LocalDate endDate;

    // ?곗슱 ?먯닔 洹몃옒???곗씠??    private List<ScorePointResponse> scores;
}


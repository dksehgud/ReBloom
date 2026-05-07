package com.ssafy.rebloom.report_service.analysis.dto.response;

import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record DiaryDailyGroupResponse(
        LocalDate date,
        List<DiaryAnalysisCardResponse> diaryList
) {
}

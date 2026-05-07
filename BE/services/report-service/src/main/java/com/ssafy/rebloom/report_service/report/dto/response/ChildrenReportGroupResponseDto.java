package com.ssafy.rebloom.report_service.report.dto.response;

import java.time.LocalDate;
import java.util.List;
import lombok.Builder;

@Builder
public record ChildrenReportGroupResponseDto(
    LocalDate date,
    List<ChildrenReportResponseDto> reportList
) {
}

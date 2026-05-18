package com.ssafy.rebloom.report_service.analysis.scheduler;

import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.dto.request.RecentInsightInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.response.ActiveChildResponseDto;
import com.ssafy.rebloom.report_service.analysis.service.AnalysisInferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecentInsightScheduler {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final AuthAccessClient authAccessClient;
    private final AnalysisInferenceService analysisInferenceService;

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void generateWeeklyRecentInsights() {
        LocalDate today = LocalDate.now(SEOUL_ZONE);
        LocalDate startDate = today.minusDays(7);
        LocalDate endDate = today.minusDays(1);
        List<ActiveChildResponseDto> children = authAccessClient.getActiveChildren();

        for (ActiveChildResponseDto child : children) {
            try {
                analysisInferenceService.generateRecentInsight(
                    new RecentInsightInferenceRequestDto(child.userId(), startDate, endDate)
                );
            } catch (Exception e) {
                log.error("failed to request recent insight. childId={}", child.userId(), e);
            }
        }
    }
}

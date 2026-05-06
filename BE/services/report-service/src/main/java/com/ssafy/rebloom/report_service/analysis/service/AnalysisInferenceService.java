package com.ssafy.rebloom.report_service.analysis.service;

import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.report_service.analysis.dto.request.ConversationSessionCreateRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.DiaryAnalysisInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.RecentInsightInferenceRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisInferenceService {

    public void analyzeConversation(ConversationSessionCreateRequestDto request) {
        // TODO: Authenticate device by raspberrypi_id or device token.
        // TODO: Find childId by request.raspberrypiId().
        // TODO: Request conversation analysis to AI inference service.
        // TODO: Save conversation_analysis and conversation_keywords.
        log.info(
            "conversation analysis requested. sessionId={}, raspberrypiId={}, startedAt={}, endedAt={}, eventCount={}",
            request.sessionId(),
            request.raspberrypiId(),
            request.startedAt(),
            request.endedAt(),
            request.events().size()
        );
    }

    public void analyzeDiary(DiaryAnalysisInferenceRequestDto request) {
        // TODO: Request diary analysis to AI inference service.
        // TODO: Save diary_analysis and diary_keywords.
        log.info(
            "diary analysis requested. diaryId={}, userId={}, targetDate={}",
            request.diaryId(),
            request.userId(),
            request.targetDate()
        );
    }

    public void generateRecentInsight(RecentInsightInferenceRequestDto request) {
        validateDateRange(request);
        // TODO: Load recent diary/conversation analyses.
        // TODO: Request recent insight generation to AI inference service.
        // TODO: Save recent insight.
        log.info(
            "recent insight requested. userId={}, startDate={}, endDate={}",
            request.userId(),
            request.startDate(),
            request.endDate()
        );
    }

    private void validateDateRange(RecentInsightInferenceRequestDto request) {
        if (request.startDate().isAfter(request.endDate())) {
            throw new CustomException("startDate must be before or equal to endDate.", ErrorCode.INVALID_PARAMETER);
        }
    }
}

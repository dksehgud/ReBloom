package com.ssafy.rebloom.report_service.analysis.service;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.dto.response.AnalysisContentResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ChartResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.EmotionFlowResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ExpressionAnalysisInsightResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ExpressionAnalysisResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpressionAnalysisService {

    private final AuthAccessClient authAccessClient;

    public ExpressionAnalysisResponse getExpressionAnalysis(
            UUID counselorId,
            UUID childId,
            LocalDate baseDate,
            String type
    ) {
        authAccessClient.validateCounselorChildAccess(counselorId, childId);
        throw new UnsupportedOperationException("Not implemented yet");
    }

    public ExpressionAnalysisInsightResponse generateExpressionAnalysisInsight(
            UUID counselorId,
            UUID childId
    ) {
        authAccessClient.validateCounselorChildAccess(counselorId, childId);
        throw new UnsupportedOperationException("Not implemented yet");
    }

    public EmotionFlowResponse getEmotionFlow(
            UUID counselorId,
            UUID childId,
            LocalDate baseDate,
            String period,
            String type
    ) {
        authAccessClient.validateCounselorChildAccess(counselorId, childId);
        throw new UnsupportedOperationException("Not implemented yet");
    }

    public ChartResponse getDiaryAnalysisChart(
            UUID counselorId,
            UUID childId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        authAccessClient.validateCounselorChildAccess(counselorId, childId);
        throw new UnsupportedOperationException("Not implemented yet");
    }

    public AnalysisContentResponse getDiaryAnalysisContent(
            UUID counselorId,
            UUID childId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        authAccessClient.validateCounselorChildAccess(counselorId, childId);
        throw new UnsupportedOperationException("Not implemented yet");
    }

    public ChartResponse getConversationAnalysisChart(
            UUID counselorId,
            UUID childId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        authAccessClient.validateCounselorChildAccess(counselorId, childId);
        throw new UnsupportedOperationException("Not implemented yet");
    }

    public AnalysisContentResponse getConversationAnalysisContent(
            UUID counselorId,
            UUID childId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        authAccessClient.validateCounselorChildAccess(counselorId, childId);
        throw new UnsupportedOperationException("Not implemented yet");
    }
}

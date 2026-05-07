package com.ssafy.rebloom.report_service.analysis.controller;

import com.ssafy.rebloom.report_service.analysis.dto.response.AnalysisContentResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ConversationChartResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ConversationChartPointResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.DiaryChartResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.DiaryChartPointResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.EmotionFlowResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ExpressionAnalysisResponse;
import com.ssafy.rebloom.report_service.analysis.service.ExpressionAnalysisService;
import com.ssafy.rebloom.security.annotation.LoginUserId;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/counselors/analyses")
@PreAuthorize("hasRole('COUNSELOR')")
public class CounselorAnalysisController {

    private final ExpressionAnalysisService expressionAnalysisService;

    @GetMapping("/expressions")
    public ResponseEntity<ExpressionAnalysisResponse> getExpressionAnalysis(
        @LoginUserId UUID counselorId,
        @RequestParam UUID childId
    ) {
        ExpressionAnalysisResponse response = expressionAnalysisService.getExpressionAnalysis(
            counselorId,
            childId
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/emotion-flow")
    public ResponseEntity<EmotionFlowResponse> getEmotionFlow(
        @LoginUserId UUID counselorId,
        @RequestParam UUID childId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baseDate,
        @RequestParam String period,
        @RequestParam(defaultValue = "ALL") String type
    ) {
        EmotionFlowResponse response = expressionAnalysisService.getEmotionFlow(
            counselorId,
            childId,
            baseDate,
            period,
            type
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/diaries/charts")
    public ResponseEntity<DiaryChartResponse> getDiaryAnalysisChart(
            @LoginUserId UUID counselorId,
            @RequestParam UUID childId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        DiaryChartResponse response = expressionAnalysisService.getDiaryAnalysisChart(
                counselorId,
                childId,
                startDate,
                endDate
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/diaries/contents")
    public ResponseEntity<AnalysisContentResponse> getDiaryAnalysisContent(
            @LoginUserId UUID counselorId,
            @RequestParam UUID childId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        AnalysisContentResponse response = expressionAnalysisService.getDiaryAnalysisContent(
                counselorId,
                childId,
                startDate,
                endDate
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations/charts")
    public ResponseEntity<ConversationChartResponse> getConversationAnalysisChart(
            @LoginUserId UUID counselorId,
            @RequestParam UUID childId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        ConversationChartResponse response = expressionAnalysisService.getConversationAnalysisChart(
                counselorId,
                childId,
                startDate,
                endDate
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations/contents")
    public ResponseEntity<AnalysisContentResponse> getConversationAnalysisContent(
            @LoginUserId UUID counselorId,
            @RequestParam UUID childId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        AnalysisContentResponse response = expressionAnalysisService.getConversationAnalysisContent(
                counselorId,
                childId,
                startDate,
                endDate
        );

        return ResponseEntity.ok(response);
    }
}


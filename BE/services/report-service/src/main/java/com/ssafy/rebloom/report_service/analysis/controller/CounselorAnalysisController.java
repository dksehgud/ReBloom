package com.ssafy.rebloom.report_service.analysis.controller;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.EmotionFlowResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.AnalysisContentResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ChartResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ExpressionAnalysisInsightResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.ExpressionAnalysisResponse;
import com.ssafy.rebloom.report_service.analysis.service.ExpressionAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/counselors/analyses")
public class CounselorAnalysisController {

    private final ExpressionAnalysisService expressionAnalysisService;

    @GetMapping("/expressions")
    public ResponseEntity<BaseResponse<ExpressionAnalysisResponse>> getExpressionAnalysis(
        @RequestHeader("X-User-Id") UUID counselorId,
        @RequestParam UUID childId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baseDate,
        @RequestParam(defaultValue = "ALL") String type
    ) {
        ExpressionAnalysisResponse response = expressionAnalysisService.getExpressionAnalysis(
            counselorId,
            childId,
            baseDate,
            type
        );

        return ResponseEntity.ok(BaseResponse.success("expression analysis retrieved", response));
    }

    @PostMapping("/expressions/insight")
    public ResponseEntity<BaseResponse<ExpressionAnalysisInsightResponse>> generateExpressionAnalysisInsight(
        @RequestHeader("X-User-Id") UUID counselorId,
        @RequestParam UUID childId
    ) {
        ExpressionAnalysisInsightResponse response = expressionAnalysisService.generateExpressionAnalysisInsight(
            counselorId,
            childId
        );

        return ResponseEntity.ok(BaseResponse.success("expression insight generated", response));
    }

    @GetMapping("/emotion-flow")
    public ResponseEntity<BaseResponse<EmotionFlowResponse>> getEmotionFlow(
        @RequestHeader("X-User-Id") UUID counselorId,
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

        return ResponseEntity.ok(BaseResponse.success("emotion flow retrieved", response));
    }

    @GetMapping("/diaries/charts")
    public ResponseEntity<BaseResponse<ChartResponse>> getDiaryAnalysisChart(
            @RequestHeader("X-User-Id") UUID counselorId,
            @RequestParam UUID childId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        ChartResponse response = expressionAnalysisService.getDiaryAnalysisChart(
                counselorId,
                childId,
                startDate,
                endDate
        );

        return ResponseEntity.ok(BaseResponse.success("diary chart retrieved", response));
    }

    @GetMapping("/diaries/contetns")
    public ResponseEntity<BaseResponse<AnalysisContentResponse>> getDiaryAnalysisContent(
            @RequestHeader("X-User-Id") UUID counselorId,
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

        return ResponseEntity.ok(BaseResponse.success("diary content retrieved", response));
    }

    @GetMapping("/conversations/charts")
    public ResponseEntity<BaseResponse<ChartResponse>> getConversationAnalysisChart(
            @RequestHeader("X-User-Id") UUID counselorId,
            @RequestParam UUID childId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        ChartResponse response = expressionAnalysisService.getConversationAnalysisChart(
                counselorId,
                childId,
                startDate,
                endDate
        );

        return ResponseEntity.ok(BaseResponse.success("conversation chart retrieved", response));
    }

    @GetMapping("/conversations/contetns")
    public ResponseEntity<BaseResponse<AnalysisContentResponse>> getConversationAnalysisContent(
            @RequestHeader("X-User-Id") UUID counselorId,
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

        return ResponseEntity.ok(BaseResponse.success("conversation content retrieved", response));
    }
}


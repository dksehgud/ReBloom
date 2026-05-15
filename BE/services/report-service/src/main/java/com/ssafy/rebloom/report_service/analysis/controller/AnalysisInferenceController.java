package com.ssafy.rebloom.report_service.analysis.controller;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.report_service.analysis.dto.request.ConversationSessionCreateRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.DiaryAnalysisInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.RecentInsightInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.service.AnalysisInferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/analyses")
public class AnalysisInferenceController {

    private final AnalysisInferenceService analysisInferenceService;

    @PostMapping("/conversations")
    public ResponseEntity<BaseResponse<Void>> analyzeConversation(
        @RequestBody @Valid ConversationSessionCreateRequestDto request
    ) {
        analysisInferenceService.analyzeConversation(request);
        return ResponseEntity.accepted().body(BaseResponse.success("conversation analysis requested"));
    }

    @PostMapping("/diaries")
    public ResponseEntity<BaseResponse<Void>> analyzeDiary(
        @RequestBody @Valid DiaryAnalysisInferenceRequestDto request
    ) {
        analysisInferenceService.analyzeDiary(request);
        return ResponseEntity.accepted().body(BaseResponse.success("diary analysis requested"));
    }

    @PostMapping("/recent-insights")
    public ResponseEntity<BaseResponse<Void>> generateRecentInsight(
        @RequestBody @Valid RecentInsightInferenceRequestDto request
    ) {
        analysisInferenceService.generateRecentInsight(request);
        return ResponseEntity.accepted().body(BaseResponse.success("recent insight requested"));
    }
}

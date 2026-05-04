package com.ssafy.rebloom.report_service.analysis.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.report_service.analysis.dto.request.ConversationSessionCreateRequestDto;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/conversations/sessions")
public class ConversationSessionController {

    @PostMapping("/analysis")
    public ResponseEntity<BaseResponse<Void>> createConversationSessionAnalysis(
            @RequestBody @Valid ConversationSessionCreateRequestDto request
    ) {
        // TODO: Authenticate device by raspberrypi_id or device token.
        // TODO: Find childId by request.raspberrypiId().
        // TODO: Request conversation analysis to RunPod.
        // TODO: Save conversation_analysis and conversation_keywords.

        log.info(
                "conversation session received. sessionId={}, raspberrypiId={}, startedAt={}, endedAt={}, eventCount={}",
                request.sessionId(),
                request.raspberrypiId(),
                request.startedAt(),
                request.endedAt(),
                request.events().size()
        );

        return ResponseEntity.ok(BaseResponse.success("conversation session received"));
    }
}

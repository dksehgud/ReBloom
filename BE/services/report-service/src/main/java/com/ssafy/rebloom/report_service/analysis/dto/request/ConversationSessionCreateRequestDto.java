package com.ssafy.rebloom.report_service.analysis.dto.request;

import java.time.OffsetDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record ConversationSessionCreateRequestDto(

    @NotBlank
    @JsonProperty("session_id")
    String sessionId,

    @NotBlank
    @JsonProperty("raspberrypi_id")
    String raspberrypiId,

    @NotNull
    @JsonProperty("started_at")
    OffsetDateTime startedAt,

    @NotNull
    @JsonProperty("ended_at")
    OffsetDateTime endedAt,

    @Valid
    @NotEmpty
    List<ConversationEventDto> events
) {

    public record ConversationEventDto(
        String child,
        String bot
    ) {
    }
}

package com.ssafy.rebloom.event.dto;

import java.time.LocalDate;
import java.util.UUID;

public record DiaryAnalysisRequestedEvent(
    UUID jobId,
    UUID diaryId,
    UUID userId,
    LocalDate targetDate,
    String emotionIcon,
    String content
) {
}

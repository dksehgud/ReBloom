package com.ssafy.rebloom.biometric_service.dto.response;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;

public record SleepChartResponseDto(
    LocalDate date,
    DayOfWeek dayOfWeek,
    String dayLabel,
    Double value
) {

    public static SleepChartResponseDto from(LocalDate date, Double score) {
        return new SleepChartResponseDto(
            date,
            date.getDayOfWeek(),
            toKoreanDayLabel(date),
            score
        );
    }

    private static String toKoreanDayLabel(LocalDate date) {
        return date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.KOREAN);
    }
}

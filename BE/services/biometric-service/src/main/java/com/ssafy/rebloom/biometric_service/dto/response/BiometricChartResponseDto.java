package com.ssafy.rebloom.biometric_service.dto.response;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;

public record BiometricChartResponseDto(
    LocalDate date,
    DayOfWeek dayOfWeek,
    String dayLabel,
    Double value
) {

    public static BiometricChartResponseDto from(LocalDate date, Double value) {
        return new BiometricChartResponseDto(
            date,
            date.getDayOfWeek(),
            toKoreanDayLabel(date),
            value
        );
    }

    private static String toKoreanDayLabel(LocalDate date) {
        return date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.KOREAN);
    }
}
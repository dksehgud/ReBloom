package com.ssafy.rebloom.report_service.analysis.dto.request;

import java.util.List;

public record DepressionSvrPredictRequest(
    List<Double> features
) {
}

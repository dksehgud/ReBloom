package com.ssafy.rebloom.report_service.analysis.repository;

import java.util.UUID;

public interface KeywordProjection {

    UUID getAnalysisId();

    String getKeyword();
}

package com.ssafy.rebloom.report_service.analysis.repository;

import com.ssafy.rebloom.report_service.analysis.domain.entity.AnalysisKeyword;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalysisKeywordRepository extends JpaRepository<AnalysisKeyword, Integer> {

    Optional<AnalysisKeyword> findByKeyword(String keyword);
}


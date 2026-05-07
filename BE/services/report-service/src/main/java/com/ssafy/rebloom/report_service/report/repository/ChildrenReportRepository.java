package com.ssafy.rebloom.report_service.report.repository;

import com.ssafy.rebloom.report_service.report.domain.entity.ChildrenReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ChildrenReportRepository extends JpaRepository<ChildrenReport, UUID> {

    
    @Query(value = """
        SELECT id,
               children_id,
               parent_id,
               emotion_tag,
               context,
               report_date,
               has_counselor_comment,
               created_at,
               modified_at
        FROM children_reports
        WHERE children_id = :childrenId
          AND report_date BETWEEN :startDateTime AND :endDateTime
        ORDER BY report_date ASC
        """, nativeQuery = true)
    List<ChildrenReport> findReportsByDateRange(
        @Param("childrenId") UUID childrenId,
        @Param("startDateTime") LocalDateTime startDateTime,
        @Param("endDateTime") LocalDateTime endDateTime
    );
}

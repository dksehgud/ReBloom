package com.ssafy.rebloom.report_service.report.repository;

import com.ssafy.rebloom.report_service.report.domain.entity.CounselorComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CounselorCommentRepository extends JpaRepository<CounselorComment, UUID> {

    @Query(value = """
        SELECT id,
               user_id,
               context,
               created_at,
               modified_at,
               parent_report_id
        FROM counselor_comments
        WHERE parent_report_id = :parentReportId
        ORDER BY created_at ASC
        """, nativeQuery = true)
    List<CounselorComment> findByParentReportId(
        @Param("parentReportId") UUID parentReportId
    );
}

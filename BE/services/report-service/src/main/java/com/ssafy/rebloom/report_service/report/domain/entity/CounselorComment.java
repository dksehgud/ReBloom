package com.ssafy.rebloom.report_service.report.domain.entity;

import com.ssafy.rebloom.common.entity.BaseTime;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Entity
@Builder
@Table(name = "counselor_comments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class CounselorComment extends BaseTime {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String context;

    @Column(name = "parent_report_id", nullable = false)
    private UUID parentReportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_report_id", referencedColumnName = "id", insertable = false, updatable = false)
    private ChildrenReport childrenReport;

    public boolean isWrittenBy(UUID counselorId) {
        return userId.equals(counselorId);
    }
}


package com.ssafy.rebloom.report_service.report.entity;

import java.util.UUID;

import com.ssafy.rebloom.common.entity.BaseTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
}

package com.ssafy.rebloom.report_service.report.domain.entity;

import com.ssafy.rebloom.common.entity.BaseTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Entity
@Builder
@Table(name = "children_reports")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ChildrenReport extends BaseTime {

    @Id
    private UUID id;

    @Column(name = "children_id", nullable = false)
    private UUID childrenId;

    @Column(name = "parent_id", nullable = false)
    private UUID parentId;

    @Column(name = "emotion_tag", nullable = false)
    private String emotionTag;

    @Column(nullable = false)
    private String context;

    @Column(name = "report_date", nullable = false)
    private LocalDateTime reportDate;

    @Column(name = "has_counselor_comment", nullable = false)
    private boolean hasCounselorComment;

    public void update(String emotionTag, String context, LocalDateTime reportDate) {
        this.emotionTag = emotionTag;
        this.context = context;
        this.reportDate = reportDate;
    }

    public void markHasCounselorComment(boolean hasCounselorComment) {
        this.hasCounselorComment = hasCounselorComment;
    }
}


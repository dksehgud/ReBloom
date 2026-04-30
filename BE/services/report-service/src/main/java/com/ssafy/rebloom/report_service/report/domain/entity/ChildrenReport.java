package com.ssafy.rebloom.report_service.report.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.ssafy.rebloom.common.entity.BaseTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "children_reports")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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
}

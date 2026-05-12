package com.ssafy.rebloom.notification_service.domain.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationPayload {
    private String title;
    private String content;
    private UUID childrenId;
    private String childrenName;
    private UUID childrenReportId;
    private UUID parentId;
    private UUID counselorId;
    private String counselorName;
    private Integer depressionScore;
    private String depressionScoreText;
}

package com.ssafy.rebloom.event.config.property;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KafkaTopicsProperties {

    private String biometricRaw;
    private String sleepRaw;
    private String biometricAnalysis;
    private String anomalyVerified;
    private String conversationInitiate;
    private String analysisReportCompleted;
    private String eventDlt;
}

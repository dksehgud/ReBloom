package com.ssafy.rebloom.event.config.property;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KafkaTopicsProperties {

    private String biometricReceived;
    private String sleepReceived;
    private String anomalyAnalysed;
    private String modelTrainingRequested;
    private String modelRetrainingRequested;
    private String phqCompleted;
    private String conversationInitiated;
    private String eventDlt;
}

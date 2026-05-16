package com.ssafy.rebloom.event.core;

public final class EventTypes {

    public static final String BIOMETRIC_RECEIVED = "BIOMETRIC_RECEIVED";
    public static final String MODEL_TRAINING_REQUESTED = "MODEL_TRAINING_REQUESTED";
    public static final String SLEEP_RECEIVED = "SLEEP_DATA_RECEIVED";
    public static final String ANOMALY_ANALYSED = "ANOMALY_ANALYSED";
    public static final String CONVERSATION_INITIATED = "CONVERSATION_INITIATED";

    public static final String MODEL_RETRAINING_REQUESTED = "MODEL_RETRAINING_REQUESTED";

    public static final String PHQ_COMPLETED = "PHQ_COMPLETED";

    public static final String PARENT_REPORT_CREATED = "PARENT_REPORT_CREATED";
    public static final String PARENT_REPORT_COMMENT_CREATED = "PARENT_REPORT_COMMENT_CREATED";
    private EventTypes() {
    }
}
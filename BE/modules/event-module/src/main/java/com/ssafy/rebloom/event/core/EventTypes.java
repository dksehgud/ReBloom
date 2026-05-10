package com.ssafy.rebloom.event.core;

public final class EventTypes {

    public static final String BIOMETRIC_DATA_RECEIVED = "BIOMETRIC_DATA_RECEIVED";
    public static final String SLEEP_DATA_RECEIVED = "SLEEP_DATA_RECEIVED";
    public static final String BIOMETRIC_ANALYSIS_COMPLETED = "BIOMETRIC_ANALYSIS_COMPLETED";
    public static final String VERIFIED_ANOMALY_DETECTED = "VERIFIED_ANOMALY_DETECTED";
    public static final String INITIATE_CONVERSATION = "INITIATE_CONVERSATION";
    public static final String ANALYSIS_REPORT_COMPLETED = "ANALYSIS_REPORT_COMPLETED";

    public static final String AI_MODEL_TRAIN_REQUESTED = "AI_MODEL_TRAIN_REQUESTED";

    private EventTypes() {
    }
}
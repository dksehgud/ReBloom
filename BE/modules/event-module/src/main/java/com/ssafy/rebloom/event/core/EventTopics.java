package com.ssafy.rebloom.event.core;

public final class EventTopics {

    public static final String BIOMETRIC_RAW = "rebloom.biometric.raw.v1";
    public static final String SLEEP_RAW = "rebloom.sleep.raw.v1";
    public static final String BIOMETRIC_ANALYSIS = "rebloom.biometric.analysis.v1";
    public static final String ANOMALY_VERIFIED = "rebloom.anomaly.verified.v1";
    public static final String CONVERSATION_INITIATE = "rebloom.conversation.initiate.v1";
    public static final String ANALYSIS_REPORT_COMPLETED = "rebloom.analysis.report-completed.v1";
    public static final String EVENT_DLT = "rebloom.event.dlt.v1";

    private EventTopics() {
    }
}
package com.ssafy.rebloom.notification_service.constants;

public final class Constants {
    public static final long ALERT_COOL_TIME= 5L;
    public static final long ALERT_WINDOW = 15L;
    public static final long CONVERSATION_COOLDOWN = 15;
    public static final long CONVERSATION_THRESHOLD = 3L;

    public static final String ALERT_COOL_TIME_KEY_PREFIX = "notification:anomaly:cooldown";
    public static final String ALERT_WINDOW_KEY_PREFIX = "notification:anomaly:window";
    public static final String CONVERSATION_LOCK_KEY_PREFIX = "notification:conversation:initiated:lock:";

}

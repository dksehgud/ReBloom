package com.ssafy.rebloom.notification_service.constants;

public final class Constants {
    public static final long ALERT_COOL_TIME= 5L;
    public static final long ALERT_WINDOW = 15L;
    public static final long CONVERSATION_COOL_TIME = 15;
    public static final long CONVERSATION_THRESHOLD = 3L;

    public static final String ALERT_COOL_TIME_KEY_PREFIX = "notification:anomaly:cool:time";
    public static final String ALERT_WINDOW_KEY_PREFIX = "notification:anomaly:window";
    public static final String CONVERSATION_LOCK_KEY_PREFIX = "notification:conversation:initiated:lock:";

    public static final String ONLINE_KEY_PREFIX = "online:user:";

    public static final long ONLINE_TTL = 60L;
    public static final String CHANNEL = "notification:events";

    public static final long SSE_TIMEOUT = 30L * 60L * 1000L;

}

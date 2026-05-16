package com.ssafy.rebloom.notification_service.constants;

import java.time.ZoneId;

public final class Constants {
    public static final long ALERT_COOL_TIME= 5L;
    public static final long ALERT_WINDOW = 15L;
    public static final long CONVERSATION_COOL_TIME = 15;
    public static final long CONVERSATION_THRESHOLD = 3L;

    public static final String ALERT_COOL_TIME_KEY_PREFIX = "notification:anomaly:cool:time";
    public static final String ALERT_WINDOW_KEY_PREFIX = "notification:anomaly:window";
    public static final String CONVERSATION_LOCK_KEY_PREFIX = "notification:conversation:initiated:lock:";

    public static final String ONLINE_KEY_PREFIX = "online:user:";

    public static final String CHANNEL = "notification:events";
    public static final long SSE_HEARTBEAT_INTERVAL_MS = 30_000L;
    public static final long ONLINE_TTL = 90L;
    public static final long SSE_TIMEOUT = 30L * 60L * 1000L;

    public static final ZoneId SEOUL_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static final String CONVERSATION_START_TYPE = "conversation_start";

    public static final String ANDROID_CHANNEL_ID = "rebloom_notification";
    public static final String KEY_PREFIX = "notification:event:idempotency:";
    public static final long PROCESSING_TTL = 10L;
    public static final long COMPLETED_TTL = 7L;
}

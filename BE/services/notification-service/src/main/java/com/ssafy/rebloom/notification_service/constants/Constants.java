package com.ssafy.rebloom.notification_service.constants;

import java.time.ZoneId;

public final class Constants {
    public static final long CONVERSATION_COOL_TIME = 15;
    public static final long ANOMALY_ALERT_PHASE_COOL_TIME_MINUTES = 15L;

    public static final String ANOMALY_ALERT_PHASE_COOL_TIME_KEY_PREFIX =
        "notification:anomaly:parent-response:phase:cool:time:";
    public static final long ANOMALY_ALERT_PHASE_TTL = 30L;
    public static final long ANOMALY_ALERT_PHASE_INTERVAL_MINUTES = 5L;
    public static final int ANOMALY_ALERT_PHASE_TOTAL_ALERT_COUNT = 3;
    public static final long ANOMALY_ALERT_PHASE_SCAN_INTERVAL_MS = 30_000L;
    public static final long ANOMALY_ALERT_PHASE_LOCK_TTL_SECONDS = 60L;

    public static final String ANOMALY_ALERT_PHASE_KEY_PREFIX =
        "notification:anomaly:parent-response:phase:";
    public static final String ANOMALY_ALERT_PHASE_LOCK_KEY_PREFIX =
        "notification:anomaly:parent-response:phase:lock:";

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

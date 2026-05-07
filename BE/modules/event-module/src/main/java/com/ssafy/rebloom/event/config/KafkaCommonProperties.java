package com.ssafy.rebloom.event.config;

import com.ssafy.rebloom.event.core.EventTopics;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "rebloom.kafka")
public class KafkaCommonProperties {

    private String producerName = "unknown-service";
    private Topics topics = new Topics();
    private Retry retry = new Retry();
    private Dlt dlt = new Dlt();

    public String getProducerName() {
        return producerName;
    }

    public void setProducerName(String producerName) {
        this.producerName = producerName;
    }

    public Topics getTopics() {
        return topics;
    }

    public void setTopics(Topics topics) {
        this.topics = topics;
    }

    public Retry getRetry() {
        return retry;
    }

    public void setRetry(Retry retry) {
        this.retry = retry;
    }

    public Dlt getDlt() {
        return dlt;
    }

    public void setDlt(Dlt dlt) {
        this.dlt = dlt;
    }

    public static class Topics {

        private String biometricRaw = EventTopics.BIOMETRIC_RAW;
        private String sleepRaw = EventTopics.SLEEP_RAW;
        private String biometricAnalysis = EventTopics.BIOMETRIC_ANALYSIS;
        private String anomalyVerified = EventTopics.ANOMALY_VERIFIED;
        private String conversationInitiate = EventTopics.CONVERSATION_INITIATE;
        private String analysisReportCompleted = EventTopics.ANALYSIS_REPORT_COMPLETED;
        private String eventDlt = EventTopics.EVENT_DLT;
        private Map<String, String> extra = new HashMap<>();

        public String getBiometricRaw() {
            return biometricRaw;
        }

        public void setBiometricRaw(String biometricRaw) {
            this.biometricRaw = biometricRaw;
        }

        public String getSleepRaw() {
            return sleepRaw;
        }

        public void setSleepRaw(String sleepRaw) {
            this.sleepRaw = sleepRaw;
        }

        public String getBiometricAnalysis() {
            return biometricAnalysis;
        }

        public void setBiometricAnalysis(String biometricAnalysis) {
            this.biometricAnalysis = biometricAnalysis;
        }

        public String getAnomalyVerified() {
            return anomalyVerified;
        }

        public void setAnomalyVerified(String anomalyVerified) {
            this.anomalyVerified = anomalyVerified;
        }

        public String getConversationInitiate() {
            return conversationInitiate;
        }

        public void setConversationInitiate(String conversationInitiate) {
            this.conversationInitiate = conversationInitiate;
        }

        public String getAnalysisReportCompleted() {
            return analysisReportCompleted;
        }

        public void setAnalysisReportCompleted(String analysisReportCompleted) {
            this.analysisReportCompleted = analysisReportCompleted;
        }

        public String getEventDlt() {
            return eventDlt;
        }

        public void setEventDlt(String eventDlt) {
            this.eventDlt = eventDlt;
        }

        public Map<String, String> getExtra() {
            return extra;
        }

        public void setExtra(Map<String, String> extra) {
            this.extra = extra;
        }
    }

    public static class Retry {

        private long intervalMillis = 1000L;
        private long maxAttempts = 3L;

        public long getIntervalMillis() {
            return intervalMillis;
        }

        public void setIntervalMillis(long intervalMillis) {
            this.intervalMillis = intervalMillis;
        }

        public long getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(long maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public Duration interval() {
            return Duration.ofMillis(intervalMillis);
        }
    }

    public static class Dlt {

        private boolean enabled = true;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }
}
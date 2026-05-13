package com.ssafy.rebloom.notification_service.config.property;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "rebloom.mqtt")
public class MqttProperties {

    private String brokerUri;
    private String clientIdPrefix;
    private Integer qos;
    private String conversationStartTopicTemplate;
}
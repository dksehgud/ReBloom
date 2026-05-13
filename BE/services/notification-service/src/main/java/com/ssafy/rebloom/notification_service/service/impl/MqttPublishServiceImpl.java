package com.ssafy.rebloom.notification_service.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.rebloom.notification_service.config.property.MqttProperties;
import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.dto.request.ConversationStartMqttRequestDto;
import com.ssafy.rebloom.notification_service.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.notification_service.service.MqttPublishService;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MqttPublishServiceImpl implements MqttPublishService {
    private static final String DEFAULT_GREETING = "안녕! 무슨 일이 있니?";

    private final ObjectMapper objectMapper;
    private final MqttProperties mqttProperties;

    @Override
    public void publishConversationStart(
        ChildrenIotInfoResponseDto aiotInfo,
        String correlationId
    ) {
        String topic = String.format(
            mqttProperties.getConversationStartTopicTemplate(),
            aiotInfo.serialNumber()
        );

        ConversationStartMqttRequestDto payload = new ConversationStartMqttRequestDto(
            Constants.CONVERSATION_START_TYPE,
            aiotInfo.serialNumber(),
            DEFAULT_GREETING,
            correlationId,
            OffsetDateTime.now(Constants.SEOUL_ZONE_ID).toString()
        );

        publish(
            aiotInfo.serialNumber(),
            topic,
            payload
        );
    }

    private void publish(
        String serialNumber,
        String topic,
        ConversationStartMqttRequestDto payload
    ) {
        MqttClient mqttClient = null;

        try {
            mqttClient = new MqttClient(
                mqttProperties.getBrokerUri(),
                mqttProperties.getClientIdPrefix() + "-" + UUID.randomUUID(),
                new MemoryPersistence()
            );

            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(false);
            options.setUserName(serialNumber);
            options.setPassword(serialNumber.toCharArray());

            mqttClient.connect(options);

            byte[] body = objectMapper.writeValueAsBytes(payload);
            MqttMessage message = new MqttMessage(body);
            message.setQos(mqttProperties.getQos());
            message.setRetained(false);

            mqttClient.publish(topic, message);

            log.info(
                "Published MQTT conversation start message. topic={}, serialNumber={}",
                topic,
                serialNumber
            );
        } catch (MqttException | JsonProcessingException e) {
            throw new IllegalStateException(
                "MQTT conversation start publish failed.",
                e
            );
        } finally {
            closeQuietly(mqttClient);
        }
    }

    private void closeQuietly(MqttClient mqttClient) {
        if (mqttClient == null) {
            return;
        }

        try {
            if (mqttClient.isConnected()) {
                mqttClient.disconnect();
            }
            mqttClient.close();
        } catch (MqttException e) {
            log.warn("Failed to close MQTT client cleanly.", e);
        }
    }
}

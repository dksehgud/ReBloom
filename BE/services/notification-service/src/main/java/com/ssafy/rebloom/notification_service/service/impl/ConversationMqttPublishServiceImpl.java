package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.dto.request.ConversationStartMqttRequestDto;
import com.ssafy.rebloom.notification_service.dto.response.ChildIotDeviceResponseDto;
import com.ssafy.rebloom.notification_service.service.ConversationMqttPublishService;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConversationMqttPublishServiceImpl implements ConversationMqttPublishService {

    @Override
    public void publishConversationStart(
        ChildIotDeviceResponseDto device,
        String correlationId
    ) {
        String topic = "devices/" + device.serialNumber() + "/conversation/start";

        ConversationStartMqttRequestDto payload = new ConversationStartMqttRequestDto(
            "conversation_start",
            device.serialNumber(),
            "안녕! 무슨 일이 있니?",
            correlationId,
            OffsetDateTime.now().toString()
        );

        // 실제 MQTT client를 이용해 broker로 publish
        // broker: mqtt://jukang.duckdns.org:7000
        // username/password: device.serialNumber()
        // topic: devices/{serial_number}/conversation/start
        // payload: ConversationStartMqttRequestDto JSON
    }
}
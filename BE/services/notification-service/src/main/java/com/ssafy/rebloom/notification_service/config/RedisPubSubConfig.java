package com.ssafy.rebloom.notification_service.config;

import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.pubsub.NotificationRedisSubscriber;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
@RequiredArgsConstructor
public class RedisPubSubConfig {

    private final NotificationRedisSubscriber notificationRedisSubscriber;

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
        RedisConnectionFactory connectionFactory,
        MessageListenerAdapter notificationListenerAdapter
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(
            notificationListenerAdapter,
            new ChannelTopic(Constants.CHANNEL)
        );
        return container;
    }

    @Bean
    public MessageListenerAdapter notificationListenerAdapter() {
        return new MessageListenerAdapter(notificationRedisSubscriber, "onMessage");
    }
}
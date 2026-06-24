package com.ssafy.rebloom.notification_service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.rebloom.notification_service.client.AuthServiceInternalClient;
import com.ssafy.rebloom.notification_service.repository.NotificationRepository;
import com.ssafy.rebloom.notification_service.repository.NotificationScheduleRepository;
import com.ssafy.rebloom.notification_service.repository.NotificationSettingRepository;
import com.ssafy.rebloom.notification_service.repository.NotificationTypeRepository;
import com.ssafy.rebloom.notification_service.repository.UserFcmTokenRepository;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;

@SpringBootTest(
	properties = {
		"spring.autoconfigure.exclude=" +
			"org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
			"org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration",
		"rebloom.mqtt.broker-uri=tcp://localhost:1883",
		"spring.kafka.listener.auto-startup=false"
	}
)
class NotificationServiceApplicationTests {

	@MockitoBean
	private AuthServiceInternalClient authServiceInternalClient;

	@MockitoBean
	private NotificationRepository notificationRepository;

	@MockitoBean
	private NotificationScheduleRepository notificationScheduleRepository;

	@MockitoBean
	private NotificationSettingRepository notificationSettingRepository;

	@MockitoBean
	private NotificationTypeRepository notificationTypeRepository;

	@MockitoBean
	private UserFcmTokenRepository userFcmTokenRepository;

	@MockitoBean
	private JPAQueryFactory jpaQueryFactory;

	@MockitoBean
	private EntityManagerFactory entityManagerFactory;

	@MockitoBean
	private FirebaseApp firebaseApp;

	@MockitoBean
	private FirebaseMessaging firebaseMessaging;

	@MockitoBean
	private PlatformTransactionManager platformTransactionManager;

	@MockitoBean
	private RedisMessageListenerContainer redisMessageListenerContainer;

	@MockitoBean
	private StringRedisTemplate stringRedisTemplate;

	@Test
	void contextLoads() {
	}

}

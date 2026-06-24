package com.ssafy.rebloom.biometric_service;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.rebloom.biometric_service.client.AuthAccessClient;
import com.ssafy.rebloom.biometric_service.repository.AnomalyRepository;
import com.ssafy.rebloom.biometric_service.repository.BiometricRepository;
import com.ssafy.rebloom.biometric_service.repository.PhqResultRepository;
import com.ssafy.rebloom.biometric_service.repository.SleepRepository;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(
	properties = {
		"spring.autoconfigure.exclude=" +
			"org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
			"org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration",
		"spring.kafka.listener.auto-startup=false"
	}
)
class BiometricServiceApplicationTests {

	@MockitoBean
	private AuthAccessClient authAccessClient;

	@MockitoBean
	private AnomalyRepository anomalyRepository;

	@MockitoBean
	private BiometricRepository biometricRepository;

	@MockitoBean
	private PhqResultRepository phqResultRepository;

	@MockitoBean
	private SleepRepository sleepRepository;

	@MockitoBean
	private JPAQueryFactory jpaQueryFactory;

	@MockitoBean
	private EntityManagerFactory entityManagerFactory;

	@MockitoBean
	private JpaMetamodelMappingContext jpaMetamodelMappingContext;

	@Test
	void contextLoads() {
	}

}

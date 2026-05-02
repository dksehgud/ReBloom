package com.ssafy.rebloom.biometric_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = "com.ssafy.rebloom")
@EnableJpaAuditing
public class BiometricServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BiometricServiceApplication.class, args);
	}

}

package com.ssafy.rebloom.intake_service;

import com.ssafy.rebloom.security.annotation.EnableRebloomSecurity;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.ssafy.rebloom")
@EnableRebloomSecurity
public class IntakeServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(IntakeServiceApplication.class, args);
	}

}

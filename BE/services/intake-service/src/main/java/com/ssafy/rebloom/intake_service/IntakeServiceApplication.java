package com.ssafy.rebloom.intake_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.ssafy.rebloom")
public class IntakeServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(IntakeServiceApplication.class, args);
	}

}

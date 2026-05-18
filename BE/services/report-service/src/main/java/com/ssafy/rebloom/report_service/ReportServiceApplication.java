package com.ssafy.rebloom.report_service;

import com.ssafy.rebloom.security.annotation.EnableRebloomSecurity;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.ssafy.rebloom")
@EnableRebloomSecurity
@EnableFeignClients
@EnableAsync
@EnableScheduling
public class ReportServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReportServiceApplication.class, args);
	}

}


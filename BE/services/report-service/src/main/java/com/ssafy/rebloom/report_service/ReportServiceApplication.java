package com.ssafy.rebloom.report_service;

import com.ssafy.rebloom.security.annotation.EnableRebloomSecurity;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication(scanBasePackages = "com.ssafy.rebloom")
@EnableRebloomSecurity
@EnableFeignClients
public class ReportServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReportServiceApplication.class, args);
	}

}


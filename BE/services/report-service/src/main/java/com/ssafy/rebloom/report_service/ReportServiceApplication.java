package com.ssafy.rebloom.report_service;

import com.ssafy.rebloom.security.annotation.EnableRebloomSecurity;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.ssafy.rebloom")
@EnableRebloomSecurity
public class ReportServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReportServiceApplication.class, args);
	}

}


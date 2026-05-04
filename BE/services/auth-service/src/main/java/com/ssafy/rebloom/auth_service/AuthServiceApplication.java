package com.ssafy.rebloom.auth_service;

import com.ssafy.rebloom.security.annotation.EnableRebloomSecurity;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = "com.ssafy.rebloom")
@EnableJpaAuditing
@EnableRebloomSecurity
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

}

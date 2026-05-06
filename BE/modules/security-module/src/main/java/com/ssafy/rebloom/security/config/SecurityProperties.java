package com.ssafy.rebloom.security.config;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "rebloom.security")
public class SecurityProperties {
    private List<String> permitAll = new ArrayList<>();
}

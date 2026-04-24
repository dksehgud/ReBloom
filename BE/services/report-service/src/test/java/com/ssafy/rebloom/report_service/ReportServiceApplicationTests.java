package com.ssafy.rebloom.report_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
	properties = {
		"spring.autoconfigure.exclude=" +
			"org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
			"org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration"
	}
)
class ReportServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}

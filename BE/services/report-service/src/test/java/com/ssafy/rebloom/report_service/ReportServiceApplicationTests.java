package com.ssafy.rebloom.report_service;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.client.BiometricAnalysisFeatureClient;
import com.ssafy.rebloom.report_service.analysis.repository.AnalysisKeywordRepository;
import com.ssafy.rebloom.report_service.analysis.repository.ConversationAnalysisRepository;
import com.ssafy.rebloom.report_service.analysis.repository.ConversationKeywordRepository;
import com.ssafy.rebloom.report_service.analysis.repository.DiaryAnalysisRepository;
import com.ssafy.rebloom.report_service.analysis.repository.DiaryKeywordRepository;
import com.ssafy.rebloom.report_service.analysis.repository.RecentTrendRepository;
import com.ssafy.rebloom.report_service.analysis.repository.StatusCardRepository;
import com.ssafy.rebloom.report_service.report.repository.ChildrenReportRepository;
import com.ssafy.rebloom.report_service.report.repository.CounselorCommentRepository;
import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(
	properties = {
		"spring.autoconfigure.exclude=" +
			"org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
			"org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration",
		"RUNPOD_API_KEY=test-api-key",
		"RUNPOD_ENDPOINT_ID=test-endpoint",
		"RUNPOD_BASE_URL=http://localhost",
		"RUNPOD_WAIT_MS=1000",
		"RECENT_INSIGHT_API_URL=http://localhost",
		"RECENT_INSIGHT_API_KEY=test-api-key",
		"spring.kafka.listener.auto-startup=false"
	}
)
public class ReportServiceApplicationTests {

	@MockitoBean
	private AuthAccessClient authAccessClient;

	@MockitoBean
	private BiometricAnalysisFeatureClient biometricAnalysisFeatureClient;

	@MockitoBean
	private AnalysisKeywordRepository analysisKeywordRepository;

	@MockitoBean
	private DiaryAnalysisRepository diaryAnalysisRepository;

	@MockitoBean
	private DiaryKeywordRepository diaryKeywordRepository;

	@MockitoBean
	private ConversationAnalysisRepository conversationAnalysisRepository;

	@MockitoBean
	private ConversationKeywordRepository conversationKeywordRepository;

	@MockitoBean
	private RecentTrendRepository recentTrendRepository;

	@MockitoBean
	private StatusCardRepository statusCardRepository;

	@MockitoBean
	private ChildrenReportRepository childrenReportRepository;

	@MockitoBean
	private CounselorCommentRepository counselorCommentRepository;

	@MockitoBean
	private TransactionTemplate transactionTemplate;

	@MockitoBean
	private JPAQueryFactory jpaQueryFactory;

	@MockitoBean
	private EntityManagerFactory entityManagerFactory;

	@MockitoBean
	private DataSource dataSource;

	@Test
	void contextLoads() {
	}

}

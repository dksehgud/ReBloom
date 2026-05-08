package com.ssafy.rebloom.report_service;

import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.repository.ConversationAnalysisRepository;
import com.ssafy.rebloom.report_service.analysis.repository.ConversationKeywordRepository;
import com.ssafy.rebloom.report_service.analysis.repository.DiaryAnalysisRepository;
import com.ssafy.rebloom.report_service.analysis.repository.DiaryKeywordRepository;
import com.ssafy.rebloom.report_service.report.repository.ChildrenReportRepository;
import com.ssafy.rebloom.report_service.report.repository.CounselorCommentRepository;
import com.ssafy.rebloom.report_service.report.repository.RecentTrendRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(
	properties = {
		"spring.autoconfigure.exclude=" +
			"org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
			"org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration"
	}
)
public class ReportServiceApplicationTests {

	@MockitoBean
	private AuthAccessClient authAccessClient;

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
	private ChildrenReportRepository childrenReportRepository;

	@MockitoBean
	private CounselorCommentRepository counselorCommentRepository;

	@Test
	void contextLoads() {
	}

}

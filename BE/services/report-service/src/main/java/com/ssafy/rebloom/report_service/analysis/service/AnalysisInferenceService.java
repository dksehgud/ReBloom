package com.ssafy.rebloom.report_service.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.client.BiometricAnalysisFeatureClient;
import com.ssafy.rebloom.report_service.analysis.domain.entity.*;
import com.ssafy.rebloom.report_service.analysis.dto.request.ConversationSessionCreateRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.DepressionSvrPredictRequest;
import com.ssafy.rebloom.report_service.analysis.dto.request.DiaryAnalysisInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.RecentInsightInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.response.BiometricAnalysisFeatureResponse;
import com.ssafy.rebloom.report_service.analysis.dto.response.DepressionSvrPredictResponse;
import com.ssafy.rebloom.report_service.analysis.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisInferenceService {

    private static final String RUNPOD_COMPLETED_STATUS = "COMPLETED";
    private static final Set<String> RUNPOD_FAILED_STATUSES = Set.of("FAILED", "CANCELLED", "TIMED_OUT");
    private static final int FEATURE_COUNT = 11;
    private static final int SLEEP_FEATURE_INDEX = 9;
    private static final int PHQ_FEATURE_INDEX = 10;
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    /*
     * RestClient.Builder
     * - Spring이 제공하는 HTTP 클라이언트 생성기입니다.
     * - 이 서비스에서는 외부 HTTP API를 두 군데 호출합니다.
     *   1. RunPod: 일기/대화 우울 단계 추론
     *   2. Recent Insight API: 최근 7일 추이 한 문장 요약
     */
    private final RestClient.Builder restClientBuilder;

    private final AuthAccessClient authAccessClient;
    private final BiometricAnalysisFeatureClient biometricAnalysisFeatureClient;
    private final AnalysisKeywordRepository analysisKeywordRepository;
    private final DiaryAnalysisRepository diaryAnalysisRepository;
    private final ConversationAnalysisRepository conversationAnalysisRepository;
    private final ConversationKeywordRepository conversationKeywordRepository;
    private final DiaryKeywordRepository diaryKeywordRepository;
    private final RecentTrendRepository recentTrendRepository;
    private final TransactionTemplate transactionTemplate;

    /*
     * @Value("${...}")
     * - application.yaml 또는 .env.local 환경변수에서 값을 읽어옵니다.
     * - 지금은 default 값을 넣지 않았습니다.
     * - 따라서 .env.local에 값이 없으면 애플리케이션이 시작할 때 바로 실패합니다.
     *   잘못된 endpoint로 조용히 요청하는 것보다 빨리 실패하는 편이 안전합니다.
     */
    @Value("${RUNPOD_API_KEY}")
    private String runpodApiKey;

    @Value("${RUNPOD_ENDPOINT_ID}")
    private String runpodEndpointId;

    @Value("${RUNPOD_BASE_URL}")
    private String runpodBaseUrl;

    @Value("${RUNPOD_WAIT_MS}")
    private long runpodWaitMs;

    @Value("${RUNPOD_POLL_INTERVAL_MS:2000}")
    private long runpodPollIntervalMs;

    @Value("${RECENT_INSIGHT_API_URL}")
    private String recentInsightApiUrl;

    @Value("${RECENT_INSIGHT_API_KEY}")
    private String recentInsightApiKey;

    @Value("${rebloom.client.bio-ml-service-url}")
    private String bioMlServiceUrl;
    @Value("${RECENT_INSIGHT_MODEL:gpt-4o-mini}")
    private String recentInsightModel;

    @Async("analysisTaskExecutor")
    public void analyzeConversation(ConversationSessionCreateRequestDto request) {
        /*
         * 이 메서드는 IoT 기기에서 대화 세션이 끝난 뒤 호출됩니다.
         *
         * request 예시:
         * {
         *   "session_id": "...",
         *   "raspberrypi_id": "...",
         *   "started_at": "...",
         *   "ended_at": "...",
         *   "events": [
         *     { "child": "..." },
         *     { "bot": "..." }
         *   ]
         * }
         *
         * 전체 흐름:
         * 1. events를 RunPod가 원하는 text 형식으로 바꾼다.
         * 2. RunPod에 text를 보내 prediction을 받는다.
         * 3. raspberrypi_id로 기기 소유 아동 ID를 조회한다.
         * 4. RunPod output을 conversation_analysis와 conversation_keywords에 저장한다.
         */
        log.info(
            "conversation analysis requested. sessionId={}, raspberrypiId={}, startedAt={}, endedAt={}, eventCount={}",
            request.sessionId(),
            request.raspberrypiId(),
            request.startedAt(),
            request.endedAt(),
            request.events().size()
        );

        /*
         * RunPod receives only one "text" field. Conversation events are flattened in
         * chronological order, with child utterances marked as User and bot utterances
         * marked as Bot, matching the agreed model input contract:
         *
         *   {
         *     "input": {
         *       "text": "User: ...\nBot: ..."
         *     }
         *   }
         */
        String text = buildConversationText(request.events());
        JsonNode output = requestRunpod(text);
        UUID childrenId = authAccessClient.getChildrenIdByDeviceSerial(request.raspberrypiId());
        UUID analysisId = parseSessionId(request.sessionId());
        LocalDate targetDate = resolveTargetDate(output, request.endedAt().toLocalDateTime().toLocalDate());
        LocalDateTime referenceDateTime = request.endedAt().toLocalDateTime();
        Double prediction = inferPredictionScore(output, childrenId, targetDate, referenceDateTime);
        List<String> keywords = readRequiredTextList(output, "keywords");

        transactionTemplate.executeWithoutResult(status -> {
            conversationAnalysisRepository.save(ConversationAnalysis.builder()
                .id(new ConversationAnalysisId(analysisId, childrenId))
                .startedAt(request.startedAt().toLocalDateTime())
                .endedAt(request.endedAt().toLocalDateTime())
                .embeddingText(readRequiredText(output, "embedding_text"))
                .prediction(prediction)
                .aiInitiated(false)
                .build());
            saveConversationKeywords(analysisId, childrenId, keywords);
        });

        log.info(
            "conversation analysis completed. sessionId={}, raspberrypiId={}, userId={}, prediction={}, keywords={}, output={}",
            request.sessionId(),
            request.raspberrypiId(),
            childrenId,
            prediction,
            keywords,
            output
        );
    }

    @Async("analysisTaskExecutor")
    public void analyzeDiary(DiaryAnalysisInferenceRequestDto request) {
        /*
         * 이 메서드는 일기 분석 요청이 들어왔을 때 호출됩니다.
         *
         * 대화와 달리 일기 DTO에는 user_id가 이미 들어있습니다.
         * 그래서 raspberrypi_id -> userId 변환 과정이 필요 없습니다.
         *
         * 전체 흐름:
         * 1. request.content()를 RunPod input.text로 보낸다.
         * 2. RunPod output에서 embedding_text, prediction, keywords를 읽는다.
         * 3. 요청에 포함된 emotion_icon과 RunPod output을 diary_analysis / diary_keywords에 저장한다.
         */
        log.info(
            "diary analysis requested. diaryId={}, userId={}, targetDate={}",
            request.diaryId(),
            request.userId(),
            request.targetDate()
        );

        /*
         * Diary analysis uses the same RunPod contract as conversation analysis.
         * The diary content is already a single text body, so it can be sent as-is.
         */
        JsonNode output = requestRunpod(request.content());
        LocalDate targetDate = resolveTargetDate(output, request.targetDate());
        LocalDateTime referenceDateTime = targetDate.plusDays(1).atStartOfDay();
        Double prediction = inferPredictionScore(output, request.userId(), targetDate, referenceDateTime);
        List<String> keywords = readRequiredTextList(output, "keywords");

        transactionTemplate.executeWithoutResult(status -> {
            diaryAnalysisRepository.save(DiaryAnalysis.builder()
                .id(new DiaryAnalysisId(request.diaryId(), request.userId()))
                .targetDate(request.targetDate().atStartOfDay())
                .emotionIcon(request.emotionIcon())
                .embeddingText(readRequiredText(output, "embedding_text"))
                .prediction(prediction)
                .build());
            diaryKeywordRepository.deleteByAnalysisIdAndUserId(request.diaryId(), request.userId());
            saveDiaryKeywords(request.diaryId(), request.userId(), keywords);
        });

        log.info(
            "diary analysis completed. diaryId={}, userId={}, prediction={}, keywords={}, output={}",
            request.diaryId(),
            request.userId(),
            prediction,
            keywords,
            output
        );
    }

    @Async("analysisTaskExecutor")
    public void generateRecentInsight(RecentInsightInferenceRequestDto request) {
        /*
         * 이 메서드는 최근 우울 단계 추이를 한 문장으로 요약할 때 호출됩니다.
         *
         * 주의:
         * - 이 메서드는 RunPod를 호출하지 않습니다.
         * - RunPod는 일기/대화 각각의 prediction을 만드는 모델 추론용입니다.
         * - 최근 7일 요약은 별도의 RECENT_INSIGHT_API_URL API를 호출합니다.
         *
         * 전체 흐름:
         * 1. 요청 날짜 범위가 올바른지 확인한다.
         * 2. 최근 최대 7일 동안 저장된 diary_analysis / conversation_analysis를 읽는다.
         * 3. 대화는 하루에 여러 세션이 있을 수 있으므로 날짜별 가장 높은 단계만 고른다.
         * 4. 일기 단계와 대화 단계 중에서도 날짜별 최대 단계를 계산한다.
         * 5. 이 데이터를 text prompt로 만들어 Recent Insight API에 보낸다.
         * 6. 지금 단계에서는 DB에 저장하지 않고 summary를 로그로만 확인한다.
         */
        validateDateRange(request);
        log.info(
            "recent insight requested. userId={}, startDate={}, endDate={}",
            request.userId(),
            request.startDate(),
            request.endDate()
        );

        /*
         * Recent insight is generated from recent depression stages.
         *
         * The frontend rule says conversation analysis is produced per session, but
         * only the highest depression stage in a day should be shown. That same daily
         * maximum is used here. Diary stages are already daily. For each date we keep:
         *   - diary prediction, if a diary analysis exists
         *   - conversation daily max prediction, if sessions exist
         *   - overall daily max across diary and conversation
         *
         * The generated text is passed to the recent-insight API, not RunPod. The API
         * contract is intentionally small:
         *
         *   request  = { "text": "..." }
         *   response = { "summary": "one Korean sentence about the recent trend" }
         *
         * That keeps the RunPod endpoint focused on prediction inference while the
         * LLM/RAG summarization can live behind a separate API.
         */
        List<DailyPredictionSummary> summaries = loadDailyPredictionSummaries(request);
        String insightPrompt = buildRecentInsightPrompt(request, summaries);
        JsonNode output = requestRecentInsightApi(insightPrompt);
        String summary = readInsightText(output);

        LocalDate reportDate = LocalDate.now(SEOUL_ZONE);

        transactionTemplate.executeWithoutResult(status ->
            recentTrendRepository.findByUserIdAndReportDate(request.userId(), reportDate)
                .ifPresentOrElse(
                    recentTrend -> recentTrend.updateSummary(summary),
                    () -> recentTrendRepository.save(RecentTrend.builder()
                        .id(new RecentTrendId(UUID.randomUUID(), request.userId()))
                        .reportDate(reportDate)
                        .summary(summary)
                        .build())
                ));

        log.info(
            "recent insight completed. userId={}, startDate={}, endDate={}, reportDate={}, dayCount={}, summary={}",
            request.userId(),
            request.startDate(),
            request.endDate(),
            reportDate,
            summaries.size(),
            summary
        );
    }

    private void validateDateRange(RecentInsightInferenceRequestDto request) {
        if (request.startDate().isAfter(request.endDate())) {
            throw new CustomException("startDate must be before or equal to endDate.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private JsonNode requestRunpod(String text) {
        validateRunpodText(text);

        try {
            /*
             * RunPod 요청 body는 반드시 아래 형태여야 합니다.
             *
             * {
             *   "input": {
             *     "text": "분석할 텍스트"
             *   }
             * }
             *
             * response 전체에는 status, output 등이 들어옵니다.
             * 이 서비스는 status가 COMPLETED인지 확인한 뒤 output만 반환합니다.
             */
            RestClient runpodClient = restClientBuilder
                .baseUrl(runpodBaseUrl)
                .build();

            JsonNode response = runpodClient
                .post()
                .uri("/{endpointId}/run", runpodEndpointId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + runpodApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(Map.of("input", Map.of("text", text)))
                .retrieve()
                .body(JsonNode.class);

            if (response == null) {
                throw new CustomException("RunPod returned empty response.", ErrorCode.INTERNAL_SERVER_ERROR);
            }

            String jobId = response.path("id").asText(null);
            if (!StringUtils.hasText(jobId)) {
                throw new CustomException("RunPod response does not contain job id.", ErrorCode.INTERNAL_SERVER_ERROR);
            }

            log.info("RunPod async job submitted. jobId={}", jobId);
            long deadline = System.currentTimeMillis() + runpodWaitMs;

            while (System.currentTimeMillis() <= deadline) {
                JsonNode statusResponse = runpodClient
                    .get()
                    .uri("/{endpointId}/status/{jobId}", runpodEndpointId, jobId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + runpodApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(JsonNode.class);

                if (statusResponse == null) {
                    throw new CustomException("RunPod returned empty status response.", ErrorCode.INTERNAL_SERVER_ERROR);
                }

                String status = statusResponse.path("status").asText();
                if (RUNPOD_COMPLETED_STATUS.equals(status)) {
                    JsonNode output = statusResponse.path("output");
                    if (output.isMissingNode() || output.isNull()) {
                        throw new CustomException("RunPod response does not contain output.", ErrorCode.INTERNAL_SERVER_ERROR);
                    }

                    log.info("RunPod async job completed. jobId={}", jobId);
                    return output;
                }

                if (RUNPOD_FAILED_STATUSES.contains(status)) {
                    throw new CustomException(
                        "RunPod inference failed. jobId=" + jobId + ", status=" + status,
                        ErrorCode.INTERNAL_SERVER_ERROR
                    );
                }

                sleepBeforeNextRunpodPoll(jobId, status);
            }

            throw new CustomException("RunPod inference timed out. jobId=" + jobId, ErrorCode.INTERNAL_SERVER_ERROR);
        } catch (RestClientException e) {
            log.error("RunPod inference request failed.", e);
            throw new CustomException("RunPod inference request failed.", ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private void sleepBeforeNextRunpodPoll(String jobId, String status) {
        try {
            log.debug("RunPod async job pending. jobId={}, status={}", jobId, status);
            Thread.sleep(runpodPollIntervalMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CustomException("RunPod polling interrupted.", ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private JsonNode requestRecentInsightApi(String text) {
        validateRecentInsightText(text);

        try {
            JsonNode response = restClientBuilder
                .build()
                .post()
                .uri(recentInsightApiUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + recentInsightApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(recentInsightRequestBody(text))
                .retrieve()
                .body(JsonNode.class);

            if (response == null) {
                throw new CustomException("Recent insight API returned empty response.", ErrorCode.INTERNAL_SERVER_ERROR);
            }

            if (!StringUtils.hasText(readInsightText(response))) {
                throw new CustomException("Recent insight API response missing summary.", ErrorCode.INTERNAL_SERVER_ERROR);
            }

            return response;
        } catch (RestClientResponseException e) {
            log.error(
                "Recent insight API request failed. status={}, body={}",
                e.getStatusCode(),
                e.getResponseBodyAsString(),
                e
            );
            throw new CustomException("Recent insight API request failed.", ErrorCode.INTERNAL_SERVER_ERROR);
        } catch (RestClientException e) {
            log.error("Recent insight API request failed.", e);
            throw new CustomException("Recent insight API request failed.", ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private Double inferPredictionScore(
        JsonNode output,
        UUID childrenId,
        LocalDate targetDate,
        LocalDateTime referenceDateTime
    ) {
        List<Double> features = new ArrayList<>(readRequiredDoubleList(output, "logits", FEATURE_COUNT));
        BiometricAnalysisFeatureResponse biometricFeatures = biometricAnalysisFeatureClient.getAnalysisFeatures(
            childrenId,
            targetDate,
            referenceDateTime
        );

        if (biometricFeatures != null && biometricFeatures.hasSleepData() && biometricFeatures.sleepFeature() != null) {
            features.set(SLEEP_FEATURE_INDEX, biometricFeatures.sleepFeature());
        }

        if (biometricFeatures != null && biometricFeatures.hasPhqData() && biometricFeatures.phqFeature() != null) {
            features.set(PHQ_FEATURE_INDEX, biometricFeatures.phqFeature());
        }

        return requestDepressionSvr(features);
    }

    private Double requestDepressionSvr(List<Double> features) {
        try {
            DepressionSvrPredictResponse response = restClientBuilder
                .baseUrl(bioMlServiceUrl)
                .build()
                .post()
                .uri("/api/v1/depression/svr/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(new DepressionSvrPredictRequest(features))
                .retrieve()
                .body(DepressionSvrPredictResponse.class);

            if (response == null || response.score() == null) {
                throw new CustomException("Bio ML SVR response missing score.", ErrorCode.INTERNAL_SERVER_ERROR);
            }

            return response.score();
        } catch (RestClientException e) {
            log.error("Bio ML SVR request failed.", e);
            throw new CustomException("Bio ML SVR request failed.", ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private LocalDate resolveTargetDate(JsonNode output, LocalDate defaultDate) {
        String targetDate = readText(output, "target_date", null);
        if (!StringUtils.hasText(targetDate)) {
            return defaultDate;
        }

        try {
            return LocalDate.parse(targetDate.trim());
        } catch (RuntimeException e) {
            throw new CustomException("RunPod output target_date must be ISO date.", ErrorCode.INTERNAL_SERVER_ERROR);
        }
    private Map<String, Object> recentInsightRequestBody(String text) {
        return Map.of(
            "model", recentInsightModel,
            "messages", List.of(
                Map.of(
                    "role", "system",
                    "content", "You summarize child depression-stage trends in exactly one concise Korean sentence."
                ),
                Map.of(
                    "role", "user",
                    "content", text
                )
            ),
            "temperature", 0.2
        );
    }

    private void validateRunpodText(String text) {
        /*
         * .env.local is managed outside source control, and this branch intentionally
         * does not define default values in @Value. If any RunPod setting is missing,
         * Spring will fail during startup instead of silently calling a wrong endpoint.
         * This method only validates the per-request model input.
         */
        if (!StringUtils.hasText(text)) {
            throw new CustomException("RunPod input text must not be blank.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private void validateRecentInsightText(String text) {
        /*
         * RECENT_INSIGHT_API_URL and RECENT_INSIGHT_API_KEY are also required without
         * default values. Missing values should fail app startup through @Value rather
         * than falling back to a wrong summarization target. This method validates the
         * actual request body sent to the API.
         */
        if (!StringUtils.hasText(text)) {
            throw new CustomException("Recent insight API text must not be blank.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private String buildConversationText(List<ConversationSessionCreateRequestDto.ConversationEventDto> events) {
        /*
         * IoT에서 받은 events 배열을 RunPod 모델이 이해하는 한 덩어리 text로 바꿉니다.
         *
         * 입력 events:
         * [
         *   { "child": "안녕" },
         *   { "bot": "응, 안녕" }
         * ]
         *
         * 변환 결과:
         * User: 안녕
         * Bot: 응, 안녕
         *
         * child는 User, bot은 Bot으로 표시합니다.
         */
        List<String> lines = new ArrayList<>();
        for (ConversationSessionCreateRequestDto.ConversationEventDto event : events) {
            if (StringUtils.hasText(event.child())) {
                lines.add("User: " + normalizeUtterance(event.child()));
            }
            if (StringUtils.hasText(event.bot())) {
                lines.add("Bot: " + normalizeUtterance(event.bot()));
            }
        }

        if (lines.isEmpty()) {
            throw new CustomException("Conversation events must contain child or bot text.", ErrorCode.INVALID_PARAMETER);
        }

        return String.join("\n", lines);
    }

    private String normalizeUtterance(String utterance) {
        /*
         * The sample RunPod input removes trailing ASCII periods from each utterance.
         * Keep question marks/exclamation marks because they may carry emotional signal.
         */
        String normalized = utterance.trim();
        if (normalized.endsWith(".")) {
            return normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private List<DailyPredictionSummary> loadDailyPredictionSummaries(RecentInsightInferenceRequestDto request) {
        /*
         * 최근 추이 요약에 필요한 데이터를 DB에서 읽습니다.
         *
         * 사용 범위:
         * - request.endDate 기준 최대 7일
         * - request.startDate가 더 늦으면 startDate부터 endDate까지만 사용
         *
         * 예:
         * - startDate=2026-05-01, endDate=2026-05-10 -> 실제 사용: 2026-05-04 ~ 2026-05-10
         * - startDate=2026-05-08, endDate=2026-05-10 -> 실제 사용: 2026-05-08 ~ 2026-05-10
         */
        Map<LocalDate, DailyPredictionSummary> summaries = new LinkedHashMap<>();
        LocalDate startDate = recentSevenDayStartDate(request);

        for (LocalDate date = startDate; !date.isAfter(request.endDate()); date = date.plusDays(1)) {
            summaries.put(date, new DailyPredictionSummary(date));
        }

        LocalDateTime from = startDate.atStartOfDay();
        LocalDateTime to = request.endDate().plusDays(1).atStartOfDay().minusNanos(1);

        diaryAnalysisRepository.findByPeriod(request.userId(), from, to)
            .forEach(analysis -> summaries.get(analysis.getTargetDate().toLocalDate())
                .addDiaryPrediction(analysis.getPrediction()));

        conversationAnalysisRepository.findByPeriod(request.userId(), from, to)
            .forEach(analysis -> summaries.get(analysis.getStartedAt().toLocalDate())
                .addConversationPrediction(analysis.getPrediction()));

        return summaries.values()
            .stream()
            .filter(DailyPredictionSummary::hasAnyPrediction)
            .toList();
    }

    private String buildRecentInsightPrompt(
        RecentInsightInferenceRequestDto request,
        List<DailyPredictionSummary> summaries
    ) {
        /*
         * Recent Insight API로 보낼 text를 만듭니다.
         *
         * API에는 JSON으로 { "text": prompt }가 전송됩니다.
         * prompt 안에는 날짜별 우울 단계 데이터가 들어갑니다.
         *
         * daily_max는 diary와 conversation_daily_max 중 더 심한 단계를 의미합니다.
         */
        LocalDate startDate = recentSevenDayStartDate(request);
        StringBuilder prompt = new StringBuilder();
        prompt.append("Summarize the recent depression-stage trend in exactly one Korean sentence.\n");
        prompt.append("Score range is continuous. Higher score means stronger depressive signal.\n");
        prompt.append("Period: ")
            .append(startDate)
            .append(" ~ ")
            .append(request.endDate())
            .append("\n");

        if (summaries.isEmpty()) {
            prompt.append("Analysis data: no saved diary or conversation analysis exists for this period.");
            return prompt.toString();
        }

        prompt.append("Analysis data:\n");
        for (DailyPredictionSummary summary : summaries) {
            prompt.append("- ")
                .append(summary.date())
                .append(": diary=")
                .append(summary.diaryPredictionOrNone())
                .append(", conversation_daily_max=")
                .append(summary.conversationPredictionOrNone())
                .append(", daily_max=")
                .append(summary.overallPrediction())
                .append("\n");
        }

        return prompt.toString();
    }

    private LocalDate recentSevenDayStartDate(RecentInsightInferenceRequestDto request) {
        LocalDate sevenDayStartDate = request.endDate().minusDays(6);
        if (request.startDate().isAfter(sevenDayStartDate)) {
            return request.startDate();
        }
        return sevenDayStartDate;
    }

    private String readInsightText(JsonNode output) {
        for (String fieldName : List.of("summary", "embedding_text", "insight", "text")) {
            String value = readText(output, fieldName, null);
            if (StringUtils.hasText(value)) {
                return value;
            }
        }

        String chatCompletionContent = output.path("choices")
            .path(0)
            .path("message")
            .path("content")
            .asText(null);
        if (StringUtils.hasText(chatCompletionContent)) {
            return chatCompletionContent;
        }

        String completionText = output.path("choices")
            .path(0)
            .path("text")
            .asText(null);
        if (StringUtils.hasText(completionText)) {
            return completionText;
        }

        throw new CustomException("RunPod insight output does not contain insight text.", ErrorCode.INTERNAL_SERVER_ERROR);
    }

    private String readRequiredText(JsonNode output, String fieldName) {
        String value = readText(output, fieldName, null);
        if (!StringUtils.hasText(value)) {
            throw new CustomException("RunPod output missing required field: " + fieldName, ErrorCode.INTERNAL_SERVER_ERROR);
        }
        return value;
    }

    private List<String> readRequiredTextList(JsonNode output, String fieldName) {
        List<String> values = readTextList(output, fieldName);
        if (values.isEmpty()) {
            throw new CustomException("RunPod output missing required field: " + fieldName, ErrorCode.INTERNAL_SERVER_ERROR);
        }
        return values;
    }

    private List<Double> readRequiredDoubleList(JsonNode output, String fieldName, int expectedSize) {
        JsonNode value = output.path(fieldName);
        if (!value.isArray()) {
            throw new CustomException("RunPod output missing required array field: " + fieldName, ErrorCode.INTERNAL_SERVER_ERROR);
        }

        List<Double> values = new ArrayList<>();
        value.forEach(item -> {
            if (!item.isNumber()) {
                throw new CustomException(
                    "RunPod output field must contain only numbers: " + fieldName,
                    ErrorCode.INTERNAL_SERVER_ERROR
                );
            }
            values.add(item.asDouble());
        });

        if (values.size() != expectedSize) {
            throw new CustomException(
                "RunPod output field " + fieldName + " must contain exactly " + expectedSize + " values.",
                ErrorCode.INTERNAL_SERVER_ERROR
            );
        }

        return values;
    }

    private List<String> readTextList(JsonNode output, String fieldName) {
        JsonNode value = output.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return List.of();
        }

        Set<String> values = new LinkedHashSet<>();
        if (value.isArray()) {
            value.forEach(item -> addTextValue(values, item.asText(null)));
        } else {
            String text = value.asText(null);
            if (text != null && text.contains(",")) {
                for (String item : text.split(",")) {
                    addTextValue(values, item);
                }
            } else {
                addTextValue(values, text);
            }
        }
        return List.copyOf(values);
    }

    private void addTextValue(Set<String> values, String value) {
        if (StringUtils.hasText(value)) {
            values.add(value.trim());
        }
    }

    private void saveConversationKeywords(UUID analysisId, UUID userId, List<String> keywords) {
        for (String keywordText : keywords) {
            AnalysisKeyword keyword = saveAnalysisKeyword(keywordText);

            conversationKeywordRepository.save(ConversationKeyword.builder()
                .id(new ConversationKeywordId(keyword.getKeywordId(), analysisId, userId))
                .build());
        }
    }

    private void saveDiaryKeywords(UUID analysisId, UUID userId, List<String> keywords) {
        for (String keywordText : keywords) {
            AnalysisKeyword keyword = saveAnalysisKeyword(keywordText);

            diaryKeywordRepository.save(DiaryKeyword.builder()
                .id(new DiaryKeywordId(keyword.getKeywordId(), analysisId, userId))
                .build());
        }
    }

    private AnalysisKeyword saveAnalysisKeyword(String keywordText) {
        return analysisKeywordRepository.findByKeyword(keywordText)
            .orElseGet(() -> analysisKeywordRepository.save(AnalysisKeyword.builder()
                .keyword(keywordText)
                .build()));
    }

    private UUID parseSessionId(String sessionId) {
        try {
            return UUID.fromString(sessionId);
        } catch (IllegalArgumentException e) {
            throw new CustomException("session_id must be UUID.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private String readText(JsonNode output, String fieldName, String defaultValue) {
        JsonNode value = output.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return defaultValue;
        }
        return value.asText(defaultValue);
    }

    private enum DepressionStage {
        /*
         * RunPod prediction으로 올 수 있는 값입니다.
         *
         * rank는 심각도 비교용 숫자입니다.
         * minimal  = 0
         * mild     = 1
         * moderate = 2
         * severe   = 3
         *
         * 숫자가 클수록 더 높은 우울 단계입니다.
         */
        MINIMAL("minimal", 0),
        MILD("mild", 1),
        MODERATE("moderate", 2),
        SEVERE("severe", 3);

        private final String value;
        private final int rank;

        DepressionStage(String value, int rank) {
            this.value = value;
            this.rank = rank;
        }

        static boolean isValid(String value) {
            return from(value) != null;
        }

        static DepressionStage from(String value) {
            if (!StringUtils.hasText(value)) {
                return null;
            }
            for (DepressionStage stage : values()) {
                if (stage.value.equalsIgnoreCase(value.trim())) {
                    return stage;
                }
            }
            return null;
        }

        static DepressionStage max(DepressionStage left, DepressionStage right) {
            if (left == null) {
                return right;
            }
            if (right == null) {
                return left;
            }
            return left.rank >= right.rank ? left : right;
        }
    }

    private static class DailyPredictionSummary {

        private final LocalDate date;
        private Double diaryPrediction;
        private Double conversationPrediction;

        private DailyPredictionSummary(LocalDate date) {
            this.date = date;
        }

        private LocalDate date() {
            return date;
        }

        private void addDiaryPrediction(Double prediction) {
            diaryPrediction = max(diaryPrediction, prediction);
        }

        private void addConversationPrediction(Double prediction) {
            conversationPrediction = max(conversationPrediction, prediction);
        }

        private boolean hasAnyPrediction() {
            return diaryPrediction != null || conversationPrediction != null;
        }

        private String diaryPredictionOrNone() {
            return diaryPrediction == null ? "none" : diaryPrediction.toString();
        }

        private String conversationPredictionOrNone() {
            return conversationPrediction == null ? "none" : conversationPrediction.toString();
        }

        private String overallPrediction() {
            Double max = max(diaryPrediction, conversationPrediction);
            return max == null ? "none" : max.toString();
        }

        private Double max(Double left, Double right) {
            if (left == null) {
                return right;
            }
            if (right == null) {
                return left;
            }
            return left >= right ? left : right;
        }
    }
}

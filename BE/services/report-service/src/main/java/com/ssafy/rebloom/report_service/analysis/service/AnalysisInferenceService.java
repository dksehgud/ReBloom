package com.ssafy.rebloom.report_service.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.report_service.analysis.dto.request.ConversationSessionCreateRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.DiaryAnalysisInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.RecentInsightInferenceRequestDto;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisInferenceService {

    private static final String RUNPOD_COMPLETED_STATUS = "COMPLETED";

    /*
     * RestClient.Builder
     * - Spring이 제공하는 HTTP 클라이언트 생성기입니다.
     * - 이 서비스에서는 외부 HTTP API를 두 군데 호출합니다.
     *   1. RunPod: 일기/대화 우울 단계 추론
     *   2. Recent Insight API: 최근 7일 추이 한 문장 요약
     */
    private final RestClient.Builder restClientBuilder;

    /*
     * JdbcTemplate
     * - SQL을 직접 실행하게 해주는 Spring 도구입니다.
     * - 여기서 Repository 대신 JdbcTemplate을 쓰는 이유:
     *   develop 브랜치의 migration은 컬럼명을 emotion_icon, embedding_text,
     *   prediction으로 바꿨지만, 일부 Entity 클래스는 아직 이전 컬럼명을
     *   보고 있습니다.
     * - 현재 이 서비스는 분석 결과를 DB에 INSERT하지 않습니다.
     * - generateRecentInsight에서 최근 7일 요약을 만들 때만 기존 분석 결과를
     *   SELECT하기 위해 사용합니다.
     */
    private final JdbcTemplate jdbcTemplate;

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

    @Value("${RECENT_INSIGHT_API_URL}")
    private String recentInsightApiUrl;

    @Value("${RECENT_INSIGHT_API_KEY}")
    private String recentInsightApiKey;

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
         * 3. 지금 단계에서는 DB에 저장하지 않고 결과를 로그로만 확인한다.
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

        log.info(
            "conversation analysis completed. sessionId={}, raspberrypiId={}, prediction={}, output={}",
            request.sessionId(),
            request.raspberrypiId(),
            readRequiredText(output, "prediction"),
            output
        );
    }

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
         * 3. 지금 단계에서는 DB에 저장하지 않고 결과를 로그로만 확인한다.
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

        log.info(
            "diary analysis completed. diaryId={}, userId={}, prediction={}, output={}",
            request.diaryId(),
            request.userId(),
            readRequiredText(output, "prediction"),
            output
        );
    }

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

        log.info(
            "recent insight completed. userId={}, startDate={}, endDate={}, dayCount={}, summary={}",
            request.userId(),
            request.startDate(),
            request.endDate(),
            summaries.size(),
            readInsightText(output)
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
            JsonNode response = restClientBuilder
                .baseUrl(runpodBaseUrl)
                .build()
                .post()
                .uri("/{endpointId}/runsync?wait={waitMs}", runpodEndpointId, runpodWaitMs)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + runpodApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(Map.of("input", Map.of("text", text)))
                .retrieve()
                .body(JsonNode.class);

            if (response == null) {
                throw new CustomException("RunPod returned empty response.", ErrorCode.INTERNAL_SERVER_ERROR);
            }

            String status = response.path("status").asText();
            if (!RUNPOD_COMPLETED_STATUS.equals(status)) {
                throw new CustomException("RunPod inference failed. status=" + status, ErrorCode.INTERNAL_SERVER_ERROR);
            }

            JsonNode output = response.path("output");
            if (output.isMissingNode() || output.isNull()) {
                throw new CustomException("RunPod response does not contain output.", ErrorCode.INTERNAL_SERVER_ERROR);
            }

            return output;
        } catch (RestClientException e) {
            log.error("RunPod inference request failed.", e);
            throw new CustomException("RunPod inference request failed.", ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private JsonNode requestRecentInsightApi(String text) {
        validateRecentInsightText(text);

        try {
            /*
             * 최근 추이 API 요청 body는 RunPod와 다릅니다.
             *
             * request:
             * {
             *   "text": "최근 7일 우울 단계 데이터와 지시문"
             * }
             *
             * response:
             * {
             *   "summary": "최근 우울 단계 추이를 설명하는 한 문장"
             * }
             *
             * 그래서 이 메서드는 response.summary가 있는지 검사합니다.
             */
            JsonNode response = restClientBuilder
                .build()
                .post()
                .uri(recentInsightApiUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + recentInsightApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(Map.of("text", text))
                .retrieve()
                .body(JsonNode.class);

            if (response == null) {
                throw new CustomException("Recent insight API returned empty response.", ErrorCode.INTERNAL_SERVER_ERROR);
            }

            if (!StringUtils.hasText(response.path("summary").asText(null))) {
                throw new CustomException("Recent insight API response missing summary.", ErrorCode.INTERNAL_SERVER_ERROR);
            }

            return response;
        } catch (RestClientException e) {
            log.error("Recent insight API request failed.", e);
            throw new CustomException("Recent insight API request failed.", ErrorCode.INTERNAL_SERVER_ERROR);
        }
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

        jdbcTemplate.query(
            """
            SELECT target_date, prediction
            FROM diary_analysis
            WHERE user_id = ?
              AND target_date BETWEEN ? AND ?
            """,
            rs -> {
                LocalDate date = rs.getObject("target_date", LocalDate.class);
                summaries.get(date).addDiaryPrediction(rs.getString("prediction"));
            },
            request.userId(),
            startDate,
            request.endDate()
        );

        jdbcTemplate.query(
            """
            SELECT started_at, prediction
            FROM conversation_analysis
            WHERE user_id = ?
              AND started_at >= ?
              AND started_at < ?
            """,
            rs -> {
                LocalDate date = rs.getTimestamp("started_at").toLocalDateTime().toLocalDate();
                summaries.get(date).addConversationPrediction(rs.getString("prediction"));
            },
            request.userId(),
            Timestamp.valueOf(startDate.atStartOfDay()),
            Timestamp.valueOf(request.endDate().plusDays(1).atStartOfDay())
        );

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
        prompt.append("Stage order: minimal < mild < moderate < severe.\n");
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
        throw new CustomException("RunPod insight output does not contain insight text.", ErrorCode.INTERNAL_SERVER_ERROR);
    }

    private String readRequiredText(JsonNode output, String fieldName) {
        String value = readText(output, fieldName, null);
        if (!StringUtils.hasText(value)) {
            throw new CustomException("RunPod output missing required field: " + fieldName, ErrorCode.INTERNAL_SERVER_ERROR);
        }
        return value;
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
        private DepressionStage diaryPrediction;
        private DepressionStage conversationPrediction;

        private DailyPredictionSummary(LocalDate date) {
            this.date = date;
        }

        private LocalDate date() {
            return date;
        }

        private void addDiaryPrediction(String prediction) {
            diaryPrediction = DepressionStage.max(diaryPrediction, DepressionStage.from(prediction));
        }

        private void addConversationPrediction(String prediction) {
            conversationPrediction = DepressionStage.max(conversationPrediction, DepressionStage.from(prediction));
        }

        private boolean hasAnyPrediction() {
            return diaryPrediction != null || conversationPrediction != null;
        }

        private String diaryPredictionOrNone() {
            return diaryPrediction == null ? "none" : diaryPrediction.value;
        }

        private String conversationPredictionOrNone() {
            return conversationPrediction == null ? "none" : conversationPrediction.value;
        }

        private String overallPrediction() {
            DepressionStage max = DepressionStage.max(diaryPrediction, conversationPrediction);
            return max == null ? "none" : max.value;
        }
    }
}

package com.ssafy.rebloom.report_service.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.report_service.analysis.dto.request.ConversationSessionCreateRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.DiaryAnalysisInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.RecentInsightInferenceRequestDto;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisInferenceService {

    private static final String RUNPOD_COMPLETED_STATUS = "COMPLETED";

    private final RestClient.Builder restClientBuilder;
    private final JdbcTemplate jdbcTemplate;

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

    @Transactional
    public void analyzeConversation(ConversationSessionCreateRequestDto request) {
        log.info(
            "conversation analysis requested. sessionId={}, raspberrypiId={}, startedAt={}, endedAt={}, eventCount={}",
            request.sessionId(),
            request.raspberrypiId(),
            request.startedAt(),
            request.endedAt(),
            request.events().size()
        );

        /*
         * IoT devices currently send only raspberrypi_id, not child/user_id.
         *
         * The correct long-term implementation is:
         *   1. Authenticate the device request with a device token.
         *   2. Ask auth-service which child is paired with request.raspberrypiId().
         *   3. Save the analysis using that child id as conversation_analysis.user_id.
         *
         * There is no auth-service internal endpoint for that lookup in the current
         * codebase, and the report-service datasource points at the report database,
         * so this file cannot safely join auth-service.devices directly. To keep the
         * ingestion pipeline usable in the meantime, we derive a stable temporary UUID
         * from raspberrypi_id. This is deterministic: the same raspberrypi_id always
         * maps to the same UUID, so daily aggregation still works for IoT test data.
         * Replace this method with an auth-service lookup as soon as the endpoint is
         * available.
         */
        UUID userId = resolveTemporaryUserIdByRaspberrypiId(request.raspberrypiId());

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

        UUID analysisId = UUID.randomUUID();
        saveConversationAnalysis(analysisId, userId, request, output);
        saveKeywords("conversation_keywords", analysisId, userId, output);

        log.info(
            "conversation analysis saved. sessionId={}, raspberrypiId={}, userId={}, prediction={}",
            request.sessionId(),
            request.raspberrypiId(),
            userId,
            readRequiredText(output, "prediction")
        );
    }

    @Transactional
    public void analyzeDiary(DiaryAnalysisInferenceRequestDto request) {
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

        UUID analysisId = UUID.randomUUID();
        saveDiaryAnalysis(analysisId, request, output);
        saveKeywords("diary_keywords", analysisId, request.userId(), output);

        log.info(
            "diary analysis saved. diaryId={}, userId={}, prediction={}",
            request.diaryId(),
            request.userId(),
            readRequiredText(output, "prediction")
        );
    }

    @Transactional
    public void generateRecentInsight(RecentInsightInferenceRequestDto request) {
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

        saveRecentTrend(request.userId(), output);

        log.info(
            "recent insight saved. userId={}, startDate={}, endDate={}, dayCount={}",
            request.userId(),
            request.startDate(),
            request.endDate(),
            summaries.size()
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

    private UUID resolveTemporaryUserIdByRaspberrypiId(String raspberrypiId) {
        return UUID.nameUUIDFromBytes(("raspberrypi:" + raspberrypiId).getBytes(StandardCharsets.UTF_8));
    }

    private void saveConversationAnalysis(
        UUID analysisId,
        UUID userId,
        ConversationSessionCreateRequestDto request,
        JsonNode output
    ) {
        jdbcTemplate.update(
            """
            INSERT INTO conversation_analysis (
                id,
                user_id,
                started_at,
                ended_at,
                emotion_icon,
                embedding_text,
                prediction
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            analysisId,
            userId,
            toTimestamp(request.startedAt()),
            toTimestamp(request.endedAt()),
            readText(output, "emotion_icon", "UNKNOWN"),
            readRequiredText(output, "embedding_text"),
            readPrediction(output)
        );
    }

    private void saveDiaryAnalysis(UUID analysisId, DiaryAnalysisInferenceRequestDto request, JsonNode output) {
        jdbcTemplate.update(
            """
            INSERT INTO diary_analysis (
                id,
                user_id,
                target_date,
                emotion_icon,
                embedding_text,
                prediction
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            analysisId,
            request.userId(),
            request.targetDate(),
            readText(output, "emotion_icon", "UNKNOWN"),
            readRequiredText(output, "embedding_text"),
            readPrediction(output)
        );
    }

    private void saveKeywords(String relationTableName, UUID analysisId, UUID userId, JsonNode output) {
        /*
         * RunPod returns output.keywords as an array of strings. The schema stores
         * keywords once in analysis_keywords and connects them through either
         * conversation_keywords or diary_keywords. Because analysis_keywords.keyword
         * has no unique constraint in the current migration, this method first reuses
         * an existing keyword row if one exists and otherwise creates the next integer
         * keyword_id. If high write concurrency becomes a concern, add a unique index
         * on keyword and replace this with an upsert.
         */
        JsonNode keywords = output.path("keywords");
        if (!keywords.isArray()) {
            return;
        }

        Set<String> uniqueKeywords = new LinkedHashSet<>();
        for (JsonNode keywordNode : keywords) {
            String keyword = keywordNode.asText(null);
            if (StringUtils.hasText(keyword)) {
                uniqueKeywords.add(keyword.trim());
            }
        }

        for (String keyword : uniqueKeywords) {
            Integer keywordId = findOrCreateKeyword(keyword);
            jdbcTemplate.update(
                "INSERT INTO " + relationTableName + " (keyword_id, analysis_id, user_id) VALUES (?, ?, ?)",
                keywordId,
                analysisId,
                userId
            );
        }
    }

    private Integer findOrCreateKeyword(String keyword) {
        List<Integer> ids = jdbcTemplate.queryForList(
            "SELECT keyword_id FROM analysis_keywords WHERE keyword = ? ORDER BY keyword_id LIMIT 1",
            Integer.class,
            keyword
        );
        if (!ids.isEmpty()) {
            return ids.get(0);
        }

        Integer nextId = jdbcTemplate.queryForObject(
            "SELECT COALESCE(MAX(keyword_id), 0) + 1 FROM analysis_keywords",
            Integer.class
        );
        jdbcTemplate.update(
            "INSERT INTO analysis_keywords (keyword_id, keyword) VALUES (?, ?)",
            nextId,
            keyword
        );
        return nextId;
    }

    private List<DailyPredictionSummary> loadDailyPredictionSummaries(RecentInsightInferenceRequestDto request) {
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

    private void saveRecentTrend(UUID userId, JsonNode output) {
        jdbcTemplate.update(
            """
            INSERT INTO recent_trend (
                id,
                user_id,
                report_date,
                summary
            )
            VALUES (?, ?, ?, ?)
            """,
            UUID.randomUUID(),
            userId,
            LocalDate.now(),
            readInsightText(output)
        );
    }

    private Timestamp toTimestamp(OffsetDateTime dateTime) {
        return Timestamp.valueOf(dateTime.toLocalDateTime());
    }

    private String readPrediction(JsonNode output) {
        String prediction = readRequiredText(output, "prediction");
        if (!DepressionStage.isValid(prediction)) {
            throw new CustomException("RunPod prediction is not supported: " + prediction, ErrorCode.INVALID_FORMAT);
        }
        return prediction;
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

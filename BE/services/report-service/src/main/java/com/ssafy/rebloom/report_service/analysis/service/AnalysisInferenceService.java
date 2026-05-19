package com.ssafy.rebloom.report_service.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.client.BiometricAnalysisFeatureClient;
import com.ssafy.rebloom.report_service.analysis.domain.entity.*;
import com.ssafy.rebloom.report_service.analysis.dto.request.ConversationSessionCreateRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.DiaryAnalysisInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.request.RecentInsightInferenceRequestDto;
import com.ssafy.rebloom.report_service.analysis.dto.response.BiometricAnalysisFeatureResponse;
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
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    /*
     * RestClient.Builder
     * - Spring???úÍ≥µ?òÎäî HTTP ?¥Îùº?¥Ïñ∏???ùÏÑ±Í∏∞ÏûÖ?àÎã§.
     * - ???úÎπÑ?§Ïóê?úÎäî ?∏Î? HTTP APIÎ•???Íµ∞Îç∞ ?∏Ï∂ú?©Îãà??
     *   1. RunPod: ?ºÍ∏∞/?Ä???∞Ïö∏ ?®Í≥Ñ Ï∂îÎ°†
     *   2. Recent Insight API: ÏµúÍ∑º 7??Ï∂îÏù¥ ??Î¨∏Ïû• ?îÏïΩ
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
     * - application.yaml ?êÎäî .env.local ?òÍ≤ΩÎ≥Ä?òÏóê??Í∞íÏùÑ ?ΩÏñ¥?µÎãà??
     * - ÏßÄÍ∏àÏ? default Í∞íÏùÑ ?£Ï? ?äÏïò?µÎãà??
     * - ?∞Îùº??.env.local??Í∞íÏù¥ ?ÜÏúºÎ©??†ÌîåÎ¶¨Ï??¥ÏÖò???úÏûë????Î∞îÎ°ú ?§Ìå®?©Îãà??
     *   ?òÎ™ª??endpointÎ°?Ï°∞Ïö©???îÏ≤≠?òÎäî Í≤ÉÎ≥¥??Îπ®Î¶¨ ?§Ìå®?òÎäî ?∏Ïù¥ ?àÏ†Ñ?©Îãà??
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

    @Value("${RECENT_INSIGHT_MODEL:gpt-4o-mini}")
    private String recentInsightModel;

    @Async("analysisTaskExecutor")
    public void analyzeConversation(ConversationSessionCreateRequestDto request) {
         * ??Î©îÏÑú?úÎäî IoT Í∏∞Í∏∞?êÏÑú ?Ä???∏ÏÖò???ùÎÇú ???∏Ï∂ú?©Îãà??
         * request ?àÏãú:
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
         * ?ÑÏ≤¥ ?êÎ¶Ñ:
         * 1. eventsÎ•?RunPodÍ∞Ä ?êÌïò??text ?ïÏãù?ºÎ°ú Î∞îÍæº??
         * 2. RunPod??textÎ•?Î≥¥ÎÇ¥ prediction??Î∞õÎäî??
         * 3. raspberrypi_idÎ°?Í∏∞Í∏∞ ?åÏú† ?ÑÎèô IDÎ•?Ï°∞Ìöå?úÎã§.
         * 4. RunPod output??conversation_analysis?Ä conversation_keywords???Ä?•Ìïú??
         */
        log.info(
            "conversation analysis requested. sessionId={}, raspberrypiId={}, startedAt={}, endedAt={}, eventCount={}",
            request.sessionId(),
            request.raspberrypiId(),
            request.startedAt(),
            request.endedAt(),
            request.events().size()
        );

         * RunPod receives only one "text" field. Conversation events are flattened in
         * chronological order, with child utterances marked as User and bot utterances
         * marked as Bot, matching the agreed model input contract:
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
        Double prediction = addPhqFeature(
            toPredictionScore(readRequiredText(output, "prediction")),
            childrenId,
            targetDate,
            request.endedAt().toLocalDateTime()
        );
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
         * ??Î©îÏÑú?úÎäî ?ºÍ∏∞ Î∂ÑÏÑù ?îÏ≤≠???§Ïñ¥?îÏùÑ ???∏Ï∂ú?©Îãà??
         *
         * ?Ä?îÏ? ?¨Î¶¨ ?ºÍ∏∞ DTO?êÎäî user_idÍ∞Ä ?¥Î? ?§Ïñ¥?àÏäµ?àÎã§.
         * Í∑∏Îûò??raspberrypi_id -> userId Î≥Ä??Í≥ºÏ†ï???ÑÏöî ?ÜÏäµ?àÎã§.
         *
         * ?ÑÏ≤¥ ?êÎ¶Ñ:
         * 1. request.content()Î•?RunPod input.textÎ°?Î≥¥ÎÇ∏??
         * 2. RunPod output?êÏÑú embedding_text, prediction, keywordsÎ•??ΩÎäî??
         * 3. ?îÏ≤≠???¨Ìï®??emotion_iconÍ≥?RunPod output??diary_analysis / diary_keywords???Ä?•Ìïú??
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
        JsonNode output = requestRunpod(request.content());
        LocalDate targetDate = resolveTargetDate(output, request.targetDate());
        Double prediction = addPhqFeature(
            toPredictionScore(readRequiredText(output, "prediction")),
            request.userId(),
            targetDate,
            targetDate.plusDays(1).atStartOfDay()
        );
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
         * ??Î©îÏÑú?úÎäî ÏµúÍ∑º ?∞Ïö∏ ?®Í≥Ñ Ï∂îÏù¥Î•???Î¨∏Ïû•?ºÎ°ú ?îÏïΩ?????∏Ï∂ú?©Îãà??
         *
         * Ï£ºÏùò:
         * - ??Î©îÏÑú?úÎäî RunPodÎ•??∏Ï∂ú?òÏ? ?äÏäµ?àÎã§.
         * - RunPod???ºÍ∏∞/?Ä??Í∞ÅÍ∞Å??prediction??ÎßåÎìú??Î™®Îç∏ Ï∂îÎ°†?©ÏûÖ?àÎã§.
         * - ÏµúÍ∑º 7???îÏïΩ?Ä Î≥ÑÎèÑ??RECENT_INSIGHT_API_URL APIÎ•??∏Ï∂ú?©Îãà??
         *
         * ?ÑÏ≤¥ ?êÎ¶Ñ:
         * 1. ?îÏ≤≠ ?†Ïßú Î≤îÏúÑÍ∞Ä ?¨Î∞îÎ•∏Ï? ?ïÏù∏?úÎã§.
         * 2. ÏµúÍ∑º ÏµúÎ? 7???ôÏïà ?Ä?•Îêú diary_analysis / conversation_analysisÎ•??ΩÎäî??
         * 3. ?Ä?îÎäî ?òÎ£®???¨Îü¨ ?∏ÏÖò???àÏùÑ ???àÏúºÎØÄÎ°??†ÏßúÎ≥?Í∞Ä???íÏ? ?®Í≥ÑÎß?Í≥†Î•∏??
         * 4. ?ºÍ∏∞ ?®Í≥Ñ?Ä ?Ä???®Í≥Ñ Ï§ëÏóê?úÎèÑ ?†ÏßúÎ≥?ÏµúÎ? ?®Í≥ÑÎ•?Í≥ÑÏÇ∞?úÎã§.
         * 5. ???∞Ïù¥?∞Î? text promptÎ°?ÎßåÎì§??Recent Insight API??Î≥¥ÎÇ∏??
         * 6. ÏßÄÍ∏??®Í≥Ñ?êÏÑú??DB???Ä?•ÌïòÏßÄ ?äÍ≥† summaryÎ•?Î°úÍ∑∏Î°úÎßå ?ïÏù∏?úÎã§.
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

    Double toPredictionScore(String prediction) {
        if (!StringUtils.hasText(prediction)) {
            throw new CustomException("RunPod output missing required field: prediction", ErrorCode.INTERNAL_SERVER_ERROR);
        }

        return switch (prediction.trim().toLowerCase(Locale.ROOT)) {
            case "minimal", "uncertain" -> 3.5;
            case "mild" -> 10.5;
            case "moderate" -> 14.0;
            case "severe" -> 17.5;
            default -> throw new CustomException(
                "Unsupported RunPod prediction: " + prediction,
                ErrorCode.INTERNAL_SERVER_ERROR
            );
        };
    }

    Double addPhqFeature(
        Double predictionScore,
        UUID childrenId,
        LocalDate targetDate,
        LocalDateTime referenceDateTime
    ) {
        BiometricAnalysisFeatureResponse features = biometricAnalysisFeatureClient.getAnalysisFeatures(
            childrenId,
            targetDate,
            referenceDateTime
        );

        if (features == null || !features.hasPhqData() || features.phqFeature() == null) {
            return predictionScore;
        }

        return predictionScore + features.phqFeature();
    }

    LocalDate resolveTargetDate(JsonNode output, LocalDate defaultDate) {
        String targetDate = readText(output, "target_date", null);
        if (!StringUtils.hasText(targetDate)) {
            return defaultDate;
        }

        try {
            return LocalDate.parse(targetDate.trim());
        } catch (RuntimeException e) {
            throw new CustomException("RunPod output target_date must be ISO date.", ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private JsonNode requestRunpod(String text) {
        validateRunpodText(text);

        try {
            /*
             * RunPod ?îÏ≤≠ body??Î∞òÎìú???ÑÎûò ?ïÌÉú?¨Ïïº ?©Îãà??
             *
             * {
             *   "input": {
             *     "text": "Î∂ÑÏÑù???çÏä§??
             *   }
             * }
             *
             * response ?ÑÏ≤¥?êÎäî status, output ?±Ïù¥ ?§Ïñ¥?µÎãà??
             * ???úÎπÑ?§Îäî statusÍ∞Ä COMPLETED?∏Ï? ?ïÏù∏????outputÎß?Î∞òÌôò?©Îãà??
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
            /*
             * ÏµúÍ∑º Ï∂îÏù¥ API ?îÏ≤≠ body??RunPod?Ä ?§Î¶Ö?àÎã§.
             *
             * request:
             * {
             *   "text": "ÏµúÍ∑º 7???∞Ïö∏ ?®Í≥Ñ ?∞Ïù¥?∞Ï? ÏßÄ?úÎ¨∏"
             * }
             *
             * response:
             * {
             *   "summary": "ÏµúÍ∑º ?∞Ïö∏ ?®Í≥Ñ Ï∂îÏù¥Î•??§Î™Ö?òÎäî ??Î¨∏Ïû•"
             * }
             *
             * Í∑∏Îûò????Î©îÏÑú?úÎäî response.summaryÍ∞Ä ?àÎäîÏßÄ Í≤Ä?¨Ìï©?àÎã§.
             */
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

    private Map<String, Object> recentInsightRequestBody(String text) {
        return Map.of(
            "model", recentInsightModel,
            "messages", List.of(
                Map.of(
                    "role", "system",
                    "content", "You summarize child depression-score trends in exactly one concise Korean sentence."
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
         * IoT?êÏÑú Î∞õÏ? events Î∞∞Ïó¥??RunPod Î™®Îç∏???¥Ìï¥?òÎäî ???©Ïñ¥Î¶?textÎ°?Î∞îÍøâ?àÎã§.
         *
         * ?ÖÎ†• events:
         * [
         *   { "child": "?àÎÖï" },
         *   { "bot": "?? ?àÎÖï" }
         * ]
         *
         * Î≥Ä??Í≤∞Í≥º:
         * User: ?àÎÖï
         * Bot: ?? ?àÎÖï
         *
         * child??User, bot?Ä Bot?ºÎ°ú ?úÏãú?©Îãà??
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
         * ÏµúÍ∑º Ï∂îÏù¥ ?îÏïΩ???ÑÏöî???∞Ïù¥?∞Î? DB?êÏÑú ?ΩÏäµ?àÎã§.
         *
         * ?¨Ïö© Î≤îÏúÑ:
         * - request.endDate Í∏∞Ï? ÏµúÎ? 7??
         * - request.startDateÍ∞Ä ????úºÎ©?startDateÎ∂Ä??endDateÍπåÏ?Îß??¨Ïö©
         *
         * ??
         * - startDate=2026-05-01, endDate=2026-05-10 -> ?§Ï†ú ?¨Ïö©: 2026-05-04 ~ 2026-05-10
         * - startDate=2026-05-08, endDate=2026-05-10 -> ?§Ï†ú ?¨Ïö©: 2026-05-08 ~ 2026-05-10
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
         * Recent Insight APIÎ°?Î≥¥ÎÇº textÎ•?ÎßåÎì≠?àÎã§.
         *
         * API?êÎäî JSON?ºÎ°ú { "text": prompt }Í∞Ä ?ÑÏÜ°?©Îãà??
         * prompt ?àÏóê???†ÏßúÎ≥??∞Ïö∏ ?®Í≥Ñ ?∞Ïù¥?∞Í? ?§Ïñ¥Í∞ëÎãà??
         *
         * daily_max??diary?Ä conversation_daily_max Ï§????¨Ìïú ?®Í≥ÑÎ•??òÎ??©Îãà??
         */
        LocalDate startDate = recentSevenDayStartDate(request);
        StringBuilder prompt = new StringBuilder();
        prompt.append("Summarize the recent depression-score trend in exactly one Korean sentence.\n");
        prompt.append("Higher scores mean stronger depression risk. RunPod label score mapping is minimal/uncertain=3.5, mild=10.5, moderate=14.0, severe=17.5, plus PHQ score divided by 100 when available.\n");
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
            return formatPrediction(diaryPrediction);
        }

        private String conversationPredictionOrNone() {
            return formatPrediction(conversationPrediction);
        }

        private String overallPrediction() {
            return formatPrediction(max(diaryPrediction, conversationPrediction));
        }

        private Double max(Double left, Double right) {
            if (left == null) {
                return right;
            }
            if (right == null) {
                return left;
            }
            return Math.max(left, right);
        }

        private String formatPrediction(Double prediction) {
            return prediction == null ? "none" : prediction.toString();
        }
    }
}

package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.LogEventRequest;
import com.cbrsx.backend.dto.StartSessionRequest;
import com.cbrsx.backend.dto.StartSessionResponse;
import com.cbrsx.backend.entity.Scenario;
import com.cbrsx.backend.entity.SessionEvent;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.EventRepository;
import com.cbrsx.backend.repository.ScenarioRepository;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SessionService {

    private final TraineeRepository traineeRepository;
    private final ScenarioRepository scenarioRepository;
    private final SessionRepository sessionRepository;
    private final EventRepository eventRepository;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public StartSessionResponse startSession(StartSessionRequest request) {
        String traineeId = (request.getTraineeId() != null && !request.getTraineeId().trim().isEmpty())
                ? request.getTraineeId().trim()
                : "trn-" + UUID.randomUUID();
        String traineeName = request.getTraineeName() != null ? request.getTraineeName() : "NDRF Responder";
        String batchUnit = request.getBatchUnit() != null ? request.getBatchUnit() : "NDRF 10th Battalion";

        Trainee trainee = resolveTrainee(traineeId, traineeName, batchUnit);
        Scenario scenario = resolveScenario(request.getScenarioCode());

        String sessionId = "sess-" + UUID.randomUUID();
        TrainingSession session = TrainingSession.builder()
                .sessionId(sessionId)
                .traineeId(trainee.getTraineeId())
                .scenarioId(scenario.getScenarioId())
                .startedAt(Instant.now())
                .passStatus("IN_PROGRESS")
                .build();
        sessionRepository.save(session);

        Map<String, Object> startPayload = new HashMap<>();
        startPayload.put("scenarioCode", scenario.getCode());
        SessionEvent startEvent = SessionEvent.builder()
                .eventId("evt-" + UUID.randomUUID())
                .sessionId(sessionId)
                .eventType("scenario_started")
                .eventData(toJson(startPayload))
                .timestamp(Instant.now())
                .build();
        eventRepository.save(startEvent);

        StartSessionResponse response = StartSessionResponse.builder()
                .sessionId(sessionId)
                .traineeId(trainee.getTraineeId())
                .scenarioId(scenario.getScenarioId())
                .scenarioTitle(scenario.getTitle())
                .startedAt(session.getStartedAt())
                .build();

        try {
            messagingTemplate.convertAndSend("/topic/events", startEvent);
            messagingTemplate.convertAndSend("/topic/sessions", response);
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for session start: {}", e.getMessage());
        }

        return response;
    }

    /**
     * Find-or-create with race-safety: on concurrent duplicate inserts the loser
     * catches the constraint violation and re-reads the winner's row.
     */
    private Trainee resolveTrainee(String traineeId, String traineeName, String batchUnit) {
        Trainee existing = traineeRepository.findById(traineeId).orElse(null);
        if (existing == null) {
            Trainee fresh = Trainee.builder()
                    .traineeId(traineeId)
                    .name(traineeName)
                    .batchUnit(batchUnit)
                    .build();
            try {
                return traineeRepository.saveAndFlush(fresh);
            } catch (DataIntegrityViolationException race) {
                log.debug("Concurrent trainee insert detected for {}, falling back to lookup", traineeId);
                return traineeRepository.findById(traineeId)
                        .orElseThrow(() -> race);
            }
        }
        if (!traineeName.equals(existing.getName()) || !batchUnit.equals(existing.getBatchUnit())) {
            existing.setName(traineeName);
            existing.setBatchUnit(batchUnit);
            existing = traineeRepository.save(existing);
        }
        return existing;
    }

    /**
     * Honors the requested scenario code. Only falls back to the default chemical
     * scenario when no code was supplied - and the fallback row always matches its code.
     */
    private Scenario resolveScenario(String requestedCode) {
        String scenarioCode = (requestedCode != null && !requestedCode.trim().isEmpty())
                ? requestedCode.trim()
                : "CBRN-CHEM-01";

        return scenarioRepository.findByCode(scenarioCode).orElseGet(() -> {
            Scenario created = Scenario.builder()
                    .scenarioId(slugToId(scenarioCode))
                    .code(scenarioCode)
                    .title(defaultTitleFor(scenarioCode))
                    .description("Auto-registered scenario for code " + scenarioCode)
                    .maxScore(100)
                    .build();
            try {
                return scenarioRepository.saveAndFlush(created);
            } catch (DataIntegrityViolationException race) {
                return scenarioRepository.findByCode(scenarioCode)
                        .orElseThrow(() -> race);
            }
        });
    }

    private String slugToId(String code) {
        String slug = code.toLowerCase().replaceAll("[^a-z0-9]+", "-");
        if (slug.startsWith("-")) slug = slug.substring(1);
        if (slug.endsWith("-")) slug = slug.substring(0, slug.length() - 1);
        return "scen-" + (slug.isEmpty() ? UUID.randomUUID() : slug);
    }

    private String defaultTitleFor(String code) {
        return "CBRN Scenario " + code;
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event payload", e);
            return "{}";
        }
    }

    @Transactional
    public SessionEvent logEvent(LogEventRequest request) {
        String sessionId = request.getSessionId();
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        SessionEvent event = SessionEvent.builder()
                .eventId("evt-" + UUID.randomUUID())
                .sessionId(session.getSessionId())
                .eventType(request.getEventType())
                .eventData(request.getEventData())
                .timestamp(request.getTimestamp() != null ? request.getTimestamp() : Instant.now())
                .build();

        SessionEvent saved = eventRepository.save(event);

        try {
            messagingTemplate.convertAndSend("/topic/events", saved);
            messagingTemplate.convertAndSend("/topic/sessions/" + saved.getSessionId(), saved);
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for event {}: {}", saved.getEventId(), e.getMessage());
        }

        return saved;
    }
}

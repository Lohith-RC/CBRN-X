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

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
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

    /**
     * Maximum number of telemetry events accepted per session.
     * [R2-02] Prevents unbounded event ingestion that could exhaust database storage.
     */
    private static final int MAX_EVENTS_PER_SESSION = 500;

    /**
     * Maximum acceptable drift (in seconds) between client-supplied and server timestamps.
     * [R2-03] Prevents time bonus score manipulation via fabricated timestamps.
     */
    private static final long MAX_TIMESTAMP_DRIFT_SECONDS = 5;

    @Transactional
    public SessionEvent logEvent(LogEventRequest request) {
        String sessionId = request.getSessionId();
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // [R2-02] Reject events for already-completed sessions
        if (session.getCompletedAt() != null) {
            throw new IllegalArgumentException("Session already completed: " + sessionId);
        }

        // [R2-02] Enforce per-session event count limit
        long existingCount = eventRepository.countBySessionId(sessionId);
        if (existingCount >= MAX_EVENTS_PER_SESSION) {
            throw new IllegalArgumentException("Event limit (" + MAX_EVENTS_PER_SESSION + ") reached for session: " + sessionId);
        }

        // [R2-03] Server-side timestamp validation — reject client timestamps with excessive drift
        Instant serverNow = Instant.now();
        Instant effectiveTimestamp = serverNow;
        if (request.getTimestamp() != null) {
            long driftSeconds = Math.abs(Duration.between(request.getTimestamp(), serverNow).getSeconds());
            if (driftSeconds <= MAX_TIMESTAMP_DRIFT_SECONDS) {
                effectiveTimestamp = request.getTimestamp();
            } else {
                log.warn("Client timestamp drift {}s exceeded {}s tolerance for session {} — using server time",
                        driftSeconds, MAX_TIMESTAMP_DRIFT_SECONDS, sessionId);
            }
        }

        SessionEvent event = SessionEvent.builder()
                .eventId("evt-" + UUID.randomUUID())
                .sessionId(session.getSessionId())
                .eventType(request.getEventType())
                .eventData(request.getEventData())
                .timestamp(effectiveTimestamp)
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

    /**
     * Stale session timeout reaper.
     * Automatically transitions abandoned sessions older than 30 minutes to TIMED_OUT status.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 60000)
    @Transactional
    public void reapStaleSessions() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(30));
        List<TrainingSession> activeSessions = sessionRepository.findByPassStatus("IN_PROGRESS");
        for (TrainingSession s : activeSessions) {
            if (s.getStartedAt() != null && s.getStartedAt().isBefore(cutoff)) {
                s.setCompletedAt(Instant.now());
                s.setPassStatus("TIMED_OUT");
                s.setFinalScore(0);
                sessionRepository.save(s);
                log.info("Reaped stale simulation session {} (started at {})", s.getSessionId(), s.getStartedAt());
            }
        }
    }

    /**
     * Chronological event timeline for a session, classified by severity.
     * Read-only; feeds the instructor debrief modal. No data is synthesized.
     */
    @Transactional(readOnly = true)
    public List<com.cbrsx.backend.dto.EventTimelineEntry> getEventTimeline(String sessionId) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
        return eventRepository.findBySessionIdOrderByTimestampAsc(session.getSessionId()).stream()
                .map(e -> new com.cbrsx.backend.dto.EventTimelineEntry(
                        e.getTimestamp(),
                        e.getEventType(),
                        com.cbrsx.backend.dto.EventTimelineEntry.classifySeverity(e.getEventType(), e.getEventData())))
                .toList();
    }

    /**
     * Voids an invalid session (e.g. simulator test data or aborted runs).
     * Voided sessions are excluded from every analytics computation but the
     * row and a "session_voided" audit event are preserved for traceability.
     */
    @Transactional
    public TrainingSession voidSession(String sessionId, String reason) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if ("VOIDED".equals(session.getPassStatus())) {
            throw new IllegalArgumentException("Session is already voided: " + sessionId);
        }

        session.setPassStatus("VOIDED");
        if (session.getCompletedAt() == null) {
            session.setCompletedAt(Instant.now());
        }
        TrainingSession saved = sessionRepository.save(session);

        Map<String, Object> voidPayload = new HashMap<>();
        voidPayload.put("sessionId", sessionId);
        voidPayload.put("status", "VOIDED");
        if (reason != null && !reason.isBlank()) {
            voidPayload.put("reason", reason.trim());
        }

        // Capture initiating operator username for audit traceability
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String operator = (auth != null && auth.getName() != null) ? auth.getName() : "system";
        voidPayload.put("voidedBy", operator);

        SessionEvent voidEvent = SessionEvent.builder()
                .eventId("evt-" + UUID.randomUUID())
                .sessionId(sessionId)
                .eventType("session_voided")
                .eventData(toJson(voidPayload))
                .timestamp(Instant.now())
                .build();
        eventRepository.save(voidEvent);

        try {
            messagingTemplate.convertAndSend("/topic/events", voidEvent);
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for session void {}: {}", sessionId, e.getMessage());
        }

        log.info("Session {} voided by '{}'. Reason: {}", sessionId, operator, (reason == null || reason.isBlank()) ? "not specified" : reason);
        return saved;
    }

    /**
     * [CBRN-SEC-01] Validates that the caller has authorization to access the given session.
     * Instructors, Admins, and Simulation engines have global access.
     * Callers with only ROLE_TRAINEE must own the session (matching traineeId).
     */
    @Transactional(readOnly = true)
    public void validateSessionAccess(String sessionId) {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return;
        }

        boolean hasElevatedRole = auth.getAuthorities().stream().anyMatch(a -> {
            String role = a.getAuthority();
            return "ROLE_ADMIN".equals(role) || "ROLE_INSTRUCTOR".equals(role) || "ROLE_SIMULATION".equals(role);
        });
        if (hasElevatedRole) {
            return;
        }

        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        String principalName = auth.getName();
        if (principalName != null && !principalName.equals("api-client") && !principalName.equals("dev-anonymous")) {
            if (!session.getTraineeId().equalsIgnoreCase(principalName)) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Unauthorized: You do not have permission to view session " + sessionId);
            }
        }
    }
}

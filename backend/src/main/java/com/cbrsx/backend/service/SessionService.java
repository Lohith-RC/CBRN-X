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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final TraineeRepository traineeRepository;
    private final ScenarioRepository scenarioRepository;
    private final SessionRepository sessionRepository;
    private final EventRepository eventRepository;

    @Transactional
    public StartSessionResponse startSession(StartSessionRequest request) {
        String traineeId = request.getTraineeId();
        if (traineeId == null || traineeId.trim().isEmpty()) {
            traineeId = "trn-" + UUID.randomUUID().toString().substring(0, 8);
        }

        // Upsert Trainee
        Trainee trainee = traineeRepository.findById(traineeId)
                .orElse(Trainee.builder()
                        .traineeId(traineeId)
                        .name(request.getTraineeName() != null ? request.getTraineeName() : "NDRF Responder")
                        .batchUnit(request.getBatchUnit() != null ? request.getBatchUnit() : "NDRF 10th Battalion")
                        .build());
        traineeRepository.save(trainee);

        // Find Scenario
        String scenarioCode = request.getScenarioCode() != null ? request.getScenarioCode() : "CBRN-CHEM-01";
        Scenario scenario = scenarioRepository.findByCode(scenarioCode)
                .orElseGet(() -> scenarioRepository.save(Scenario.builder()
                        .scenarioId("scen-chem-01")
                        .code("CBRN-CHEM-01")
                        .title("Chemical Spill Emergency Response")
                        .description("Industrial Chemical Leak Incident at Storage Bay 3")
                        .maxScore(100)
                        .build()));

        // Create Session
        String sessionId = "sess-" + UUID.randomUUID().toString().substring(0, 8);
        TrainingSession session = TrainingSession.builder()
                .sessionId(sessionId)
                .traineeId(trainee.getTraineeId())
                .scenarioId(scenario.getScenarioId())
                .startedAt(Instant.now())
                .passStatus("IN_PROGRESS")
                .build();
        sessionRepository.save(session);

        // Log scenario_started event
        SessionEvent startEvent = SessionEvent.builder()
                .eventId("evt-" + UUID.randomUUID().toString().substring(0, 8))
                .sessionId(sessionId)
                .eventType("scenario_started")
                .eventData("{\"scenarioCode\":\"" + scenarioCode + "\"}")
                .timestamp(Instant.now())
                .build();
        eventRepository.save(startEvent);

        return StartSessionResponse.builder()
                .sessionId(sessionId)
                .traineeId(trainee.getTraineeId())
                .scenarioId(scenario.getScenarioId())
                .scenarioTitle(scenario.getTitle())
                .startedAt(session.getStartedAt())
                .build();
    }

    @Transactional
    public SessionEvent logEvent(LogEventRequest request) {
        String sessionId = request.getSessionId();
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        SessionEvent event = SessionEvent.builder()
                .eventId("evt-" + UUID.randomUUID().toString().substring(0, 8))
                .sessionId(session.getSessionId())
                .eventType(request.getEventType())
                .eventData(request.getEventData())
                .timestamp(request.getTimestamp() != null ? request.getTimestamp() : Instant.now())
                .build();

        return eventRepository.save(event);
    }
}

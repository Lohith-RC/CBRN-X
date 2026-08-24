package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.DashboardStatsDTO;
import com.cbrsx.backend.dto.SessionSummaryDTO;
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

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final String STATUS_PASSED = "PASSED";
    private static final String STATUS_FAILED = "FAILED";
    private static final String STATUS_VOIDED = "VOIDED";

    private final SessionRepository sessionRepository;
    private final TraineeRepository traineeRepository;
    private final ScenarioRepository scenarioRepository;
    private final EventRepository eventRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        long totalTrainees = traineeRepository.count();
        long totalCompleted = sessionRepository.countCompletedSessions();
        Double avgScore = sessionRepository.averageFinalScoreOfCompleted();
        long passedCount = sessionRepository.countByPassStatusIgnoreCase(STATUS_PASSED);
        long failedCount = totalCompleted - passedCount;
        long voidedCount = sessionRepository.countByPassStatusIgnoreCase(STATUS_VOIDED);

        double passRate = totalCompleted > 0 ? (double) passedCount / totalCompleted * 100.0 : 0.0;

        Map<String, Long> passStatusCounts = new LinkedHashMap<>();
        passStatusCounts.put(STATUS_PASSED, passedCount);
        passStatusCounts.put(STATUS_FAILED, failedCount);
        passStatusCounts.put("IN_PROGRESS", Math.max(0, sessionRepository.count() - totalCompleted - voidedCount));
        if (voidedCount > 0) {
            passStatusCounts.put(STATUS_VOIDED, voidedCount);
        }

        List<TrainingSession> recent = sessionRepository.findTop10ByPassStatusNotIgnoreCaseOrderByStartedAtDesc(STATUS_VOIDED);

        Map<String, Trainee> traineesById = loadTrainees(recent);
        Map<String, Scenario> scenariosById = loadScenarios(recent);

        List<SessionSummaryDTO> recentSummaries = recent.stream()
                .map(s -> toSummary(s, traineesById, scenariosById))
                .collect(Collectors.toList());

        Map<String, Long> mistakeFrequencies = computeMistakeFrequencies(recent);

        return DashboardStatsDTO.builder()
                .totalTrainees(totalTrainees)
                .totalSessionsCompleted(totalCompleted)
                .overallPassRate(Math.round(passRate * 10.0) / 10.0)
                .averageScore(avgScore == null ? 0.0 : Math.round(avgScore * 10.0) / 10.0)
                .passStatusCounts(passStatusCounts)
                .topMistakesFrequency(mistakeFrequencies)
                .recentSessions(recentSummaries)
                .build();
    }

    private SessionSummaryDTO toSummary(TrainingSession s, Map<String, Trainee> traineesById,
                                        Map<String, Scenario> scenariosById) {
        Trainee trainee = s.getTraineeId() != null ? traineesById.get(s.getTraineeId()) : null;
        Scenario scenario = s.getScenarioId() != null ? scenariosById.get(s.getScenarioId()) : null;
        return SessionSummaryDTO.builder()
                .sessionId(s.getSessionId())
                .traineeId(s.getTraineeId())
                .traineeName(trainee != null ? trainee.getName() : "Unknown")
                .batchUnit(trainee != null ? trainee.getBatchUnit() : "-")
                .scenarioTitle(scenario != null ? scenario.getTitle() : "Unknown Scenario")
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .finalScore(s.getFinalScore())
                .passStatus(s.getPassStatus())
                .build();
    }

    /**
     * Derives mistake frequencies from the raw event stream of the recent sessions.
     * Read-only: no re-scoring, no writes (fixes the previous GET-mutation bug).
     */
    private Map<String, Long> computeMistakeFrequencies(List<TrainingSession> recent) {
        if (recent.isEmpty()) {
            return new HashMap<>();
        }
        Set<String> sessionIds = recent.stream().map(TrainingSession::getSessionId).collect(Collectors.toSet());
        List<SessionEvent> events = eventRepository.findBySessionIdIn(sessionIds);

        long hazardEntryViolations = events.stream()
                .filter(e -> "entered_hazard_zone_without_ppe".equals(e.getEventType())).count();
        long wrongDrumScans = events.stream()
                .filter(e -> "leak_source_identified".equals(e.getEventType()))
                .filter(e -> e.getEventData() != null
                        && e.getEventData().contains("\"correct\"")
                        && e.getEventData().contains("false"))
                .count();
        long deconSkips = countSessionsMissing(events, "decontamination_completed");
        long containmentSkips = countSessionsMissing(events, "containment_completed");

        Map<String, Long> frequencies = new LinkedHashMap<>();
        putIfPositive(frequencies, "Entered hazard zone without PPE", hazardEntryViolations);
        putIfPositive(frequencies, "Wrong drum flagged as leak source", wrongDrumScans);
        putIfPositive(frequencies, "Containment protocol not completed", containmentSkips);
        putIfPositive(frequencies, "Decontamination skipped", deconSkips);
        return frequencies;
    }

    private long countSessionsMissing(List<SessionEvent> events, String eventType) {
        Set<String> sessionsWithEvent = events.stream()
                .filter(e -> eventType.equals(e.getEventType()))
                .map(SessionEvent::getSessionId)
                .collect(Collectors.toSet());
        return sessionsWithEvent.size();
    }

    private void putIfPositive(Map<String, Long> map, String key, long value) {
        if (value > 0) {
            map.put(key, value);
        }
    }

    private Map<String, Trainee> loadTrainees(List<TrainingSession> sessions) {
        Set<String> ids = sessions.stream()
                .map(TrainingSession::getTraineeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return traineeRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Trainee::getTraineeId, Function.identity()));
    }

    private Map<String, Scenario> loadScenarios(List<TrainingSession> sessions) {
        Set<String> ids = sessions.stream()
                .map(TrainingSession::getScenarioId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return scenarioRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Scenario::getScenarioId, Function.identity()));
    }
}

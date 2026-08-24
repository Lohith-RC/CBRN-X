package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.CohortAnalyticsDTO;
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
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Cohort-level analytics over completed, non-voided sessions:
 * scenario difficulty breakdown, recurring weaknesses, at-risk trainees,
 * and a 14-day score trend. Voided sessions are excluded everywhere.
 */
@Service
@RequiredArgsConstructor
public class CohortAnalyticsService {

    static final String STATUS_VOIDED = "VOIDED";

    private final SessionRepository sessionRepository;
    private final EventRepository eventRepository;
    private final ScenarioRepository scenarioRepository;
    private final TraineeRepository traineeRepository;

    @Transactional(readOnly = true)
    public CohortAnalyticsDTO getCohortAnalytics() {
        List<TrainingSession> completed = sessionRepository.findByCompletedAtIsNotNull().stream()
                .filter(s -> !STATUS_VOIDED.equals(s.getPassStatus()))
                .toList();

        return new CohortAnalyticsDTO(
                buildScenarioBreakdown(completed),
                buildWeaknessBoard(completed),
                buildAtRiskTrainees(completed),
                buildTrend(completed),
                Instant.now()
        );
    }

    private List<CohortAnalyticsDTO.ScenarioStat> buildScenarioBreakdown(List<TrainingSession> completed) {
        Map<String, List<TrainingSession>> byScenario = completed.stream()
                .collect(Collectors.groupingBy(TrainingSession::getScenarioId, LinkedHashMap::new, Collectors.toList()));

        List<CohortAnalyticsDTO.ScenarioStat> stats = new ArrayList<>();
        byScenario.forEach((scenarioId, sessions) -> {
            DoubleSummaryStatistics scoreStats = sessions.stream()
                    .map(TrainingSession::getFinalScore)
                    .filter(java.util.Objects::nonNull)
                    .mapToDouble(Integer::doubleValue)
                    .summaryStatistics();

            long passed = sessions.stream()
                    .filter(s -> "PASSED".equals(s.getPassStatus()))
                    .count();
            double passRate = sessions.isEmpty() ? 0.0 : (passed * 100.0) / sessions.size();

            Scenario scenario = scenarioRepository.findById(scenarioId).orElse(null);
            stats.add(new CohortAnalyticsDTO.ScenarioStat(
                    scenarioId,
                    scenario != null ? scenario.getCode() : scenarioId,
                    scenario != null ? scenario.getTitle() : "Unknown Scenario",
                    sessions.size(),
                    scoreStats.getCount() > 0 ? round1(scoreStats.getAverage()) : null,
                    round1(passRate)
            ));
        });
        return stats;
    }

    private List<CohortAnalyticsDTO.Weakness> buildWeaknessBoard(List<TrainingSession> completed) {
        if (completed.isEmpty()) {
            return List.of();
        }

        Collection<String> sessionIds = completed.stream()
                .map(TrainingSession::getSessionId)
                .toList();
        List<SessionEvent> events = eventRepository.findBySessionIdIn(sessionIds);

        Set<String> sessionIdsWithContainment = events.stream()
                .filter(e -> "containment_completed".equals(e.getEventType()))
                .map(SessionEvent::getSessionId)
                .collect(Collectors.toSet());
        Set<String> sessionIdsWithDecon = events.stream()
                .filter(e -> "decontamination_completed".equals(e.getEventType()))
                .map(SessionEvent::getSessionId)
                .collect(Collectors.toSet());

        Map<String, Long> counts = new LinkedHashMap<>();
        counts.merge("entered_hazard_zone_without_ppe",
                events.stream().filter(e -> "entered_hazard_zone_without_ppe".equals(e.getEventType())).count(),
                Long::sum);
        counts.merge("evacuation_incomplete",
                events.stream().filter(e -> "evacuation_incomplete".equals(e.getEventType())).count(),
                Long::sum);
        counts.merge("wrong_identification",
                events.stream().filter(CohortAnalyticsService::isWrongIdentification).count(),
                Long::sum);
        counts.put("containment_skipped", completed.stream()
                .filter(s -> !sessionIdsWithContainment.contains(s.getSessionId())).count());
        counts.put("decontamination_skipped", completed.stream()
                .filter(s -> !sessionIdsWithDecon.contains(s.getSessionId())).count());

        return counts.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new CohortAnalyticsDTO.Weakness(
                        e.getKey(),
                        weaknessLabel(e.getKey()),
                        weaknessSeverity(e.getKey()),
                        e.getValue()))
                .toList();
    }

    private static boolean isWrongIdentification(SessionEvent event) {
        String type = event.getEventType();
        if (type == null || !(type.equals("leak_source_identified") || type.equals("rad_source_identified")
                || type.equals("pathogen_breach_identified"))) {
            return false;
        }
        String data = event.getEventData();
        // Mirrors ScoringService's ReDoS-safe string scan for {"correct": false}
        return data != null && data.contains("\"correct\"") && data.contains("false");
    }

    private String weaknessLabel(String key) {
        switch (key) {
            case "entered_hazard_zone_without_ppe": return "Entered hazard zone without full PPE";
            case "evacuation_incomplete": return "Civilians left behind in danger sector";
            case "wrong_identification": return "Wrong hazard source identified on first scan";
            case "containment_skipped": return "Containment step never performed";
            case "decontamination_skipped": return "Decontamination step never performed";
            default: return key;
        }
    }

    private String weaknessSeverity(String key) {
        switch (key) {
            case "entered_hazard_zone_without_ppe":
            case "containment_skipped": return "CRITICAL";
            case "evacuation_incomplete":
            case "decontamination_skipped": return "MAJOR";
            default: return "MODERATE";
        }
    }

    private List<CohortAnalyticsDTO.AtRiskTrainee> buildAtRiskTrainees(List<TrainingSession> completed) {
        Map<String, List<TrainingSession>> byTrainee = completed.stream()
                .collect(Collectors.groupingBy(TrainingSession::getTraineeId));

        List<CohortAnalyticsDTO.AtRiskTrainee> atRisk = new ArrayList<>();
        byTrainee.forEach((traineeId, sessions) -> {
            List<Integer> scores = sessions.stream()
                    .map(TrainingSession::getFinalScore)
                    .filter(java.util.Objects::nonNull)
                    .toList();
            long failed = sessions.stream()
                    .filter(s -> "FAILED".equals(s.getPassStatus()))
                    .count();

            boolean struggling = (failed > 0 && failed >= sessions.size() / 2.0)
                    || (scores.stream().mapToInt(Integer::intValue).average().orElse(100) < 70);
            if (!struggling) {
                return;
            }

            Trainee trainee = traineeRepository.findById(traineeId).orElse(null);
            atRisk.add(new CohortAnalyticsDTO.AtRiskTrainee(
                    traineeId,
                    trainee != null ? trainee.getName() : "Unknown Trainee",
                    trainee != null ? trainee.getBatchUnit() : "-",
                    sessions.size(),
                    scores.isEmpty() ? null : round1(scores.stream().mapToInt(Integer::intValue).average().orElse(0)),
                    failed
            ));
        });

        return atRisk.stream()
                .sorted(Comparator.comparing(t -> t.avgScore() == null ? 0.0 : t.avgScore()))
                .limit(5)
                .toList();
    }

    private List<CohortAnalyticsDTO.TrendPoint> buildTrend(List<TrainingSession> completed) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate start = today.minusDays(13);

        Map<LocalDate, List<Integer>> byDay = new HashMap<>();
        for (TrainingSession session : completed) {
            LocalDate day = session.getStartedAt().atZone(ZoneOffset.UTC).toLocalDate();
            if (day.isBefore(start) || session.getFinalScore() == null) {
                continue;
            }
            byDay.computeIfAbsent(day, d -> new ArrayList<>()).add(session.getFinalScore());
        }

        List<CohortAnalyticsDTO.TrendPoint> trend = new ArrayList<>(14);
        for (int i = 0; i < 14; i++) {
            LocalDate day = start.plusDays(i);
            List<Integer> scores = byDay.get(day);
            trend.add(new CohortAnalyticsDTO.TrendPoint(
                    day,
                    scores == null ? 0 : scores.size(),
                    scores == null || scores.isEmpty() ? null : round1(scores.stream().mapToInt(Integer::intValue).average().orElse(0))
            ));
        }
        return trend;
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}

package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.MistakeDetailDTO;
import com.cbrsx.backend.dto.ScoreBreakdownDTO;
import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.entity.Scenario;
import com.cbrsx.backend.entity.SessionEvent;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.EventRepository;
import com.cbrsx.backend.repository.ScenarioRepository;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class ScoringService {

    private final EventRepository eventRepository;
    private final SessionRepository sessionRepository;
    private final TraineeRepository traineeRepository;
    private final ScenarioRepository scenarioRepository;

    public ScoringService(EventRepository eventRepository, SessionRepository sessionRepository, TraineeRepository traineeRepository, ScenarioRepository scenarioRepository) {
        this.eventRepository = eventRepository;
        this.sessionRepository = sessionRepository;
        this.traineeRepository = traineeRepository;
        this.scenarioRepository = scenarioRepository;
    }

    public static final int PASS_THRESHOLD = 70;
    public static final int MAX_RAW_SCORE = 80;
    public static final int PPE_MAX_SCORE = 10;
    public static final int DETECTION_MAX_SCORE = 10;
    public static final int EVACUATION_MAX_SCORE = 15;
    public static final int EVACUATION_SCORE_PER_CIVILIAN = 5;
    public static final int CONTAINMENT_MAX_SCORE = 15;
    public static final int DECONTAMINATION_MAX_SCORE = 10;
    public static final int TIME_BONUS_MAX_SCORE = 20;
    public static final int PENALTY_ENTER_WITHOUT_PPE = 15;
    public static final int PENALTY_WRONG_DRUM_SCAN = 5;
    public static final int PENALTY_CIVILIAN_LEFT_BEHIND = 10;
    public static final int PENALTY_CONTAINMENT_SKIPPED = 15;
    public static final int PENALTY_DECON_SKIPPED = 10;
    public static final long TIER_EXCELLENT_SECONDS = 180;
    public static final long TIER_GOOD_SECONDS = 300;
    public static final long TIER_ACCEPTABLE_SECONDS = 450;

    // Use simple contains/indexOf instead of regex to avoid ReDoS
    private static final String COUNT_FIELD_KEY = "\"count\"";
    private static final String WRONG_SCAN_MARKER = "\"correct\"";
    private static final String FALSE_VALUE = "false";

    /**
     * Read-only score computation. Safe to call from GET endpoints; never mutates state.
     * For sessions without a stored completion time, the latest scenario_completed event
     * timestamp is used as the completion instant.
     */
    @Transactional(readOnly = true)
    public ScoreReportDTO previewScore(String sessionId) {
        TrainingSession session = requireSession(sessionId);
        return buildReport(session);
    }

    /**
     * Finalizes a session: stamps completion, persists final score and pass status.
     * Idempotent - re-invocation reuses the original completedAt and recomputes identically.
     */
    @Transactional
    public ScoreReportDTO finalizeSession(String sessionId) {
        TrainingSession session = requireSession(sessionId);
        if (session.getCompletedAt() == null) {
            session.setCompletedAt(resolveCompletionInstant(session));
        }
        ScoreReportDTO report = buildReport(session);
        session.setFinalScore(report.getFinalScore());
        session.setPassStatus(report.getPassStatus());
        sessionRepository.save(session);
        return report;
    }

    private TrainingSession requireSession(String sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
    }

    private Instant resolveCompletionInstant(TrainingSession session) {
        if (session.getCompletedAt() != null) {
            return session.getCompletedAt();
        }
        List<SessionEvent> events = eventRepository.findBySessionIdOrderByTimestampAsc(session.getSessionId());
        return events.stream()
                .filter(e -> "scenario_completed".equals(e.getEventType()))
                .map(SessionEvent::getTimestamp)
                .reduce((first, second) -> second)
                .orElseGet(() -> session.getStartedAt());
    }

    private ScoreReportDTO buildReport(TrainingSession session) {
        Trainee trainee = traineeRepository.findById(session.getTraineeId())
                .orElse(Trainee.builder().name("Unknown Trainee").batchUnit("NDRF Unit 1").build());

        Scenario scenario = scenarioRepository.findById(session.getScenarioId())
                .orElse(Scenario.builder().code("CBRN-CHEM-01").title("Chemical Spill Emergency").build());

        List<SessionEvent> events = eventRepository.findBySessionIdOrderByTimestampAsc(session.getSessionId());

        Instant completedAt = session.getCompletedAt() != null
                ? session.getCompletedAt()
                : events.stream()
                        .filter(e -> "scenario_completed".equals(e.getEventType()))
                        .map(SessionEvent::getTimestamp)
                        .reduce((first, second) -> second)
                        .orElse(Instant.now());

        long durationSeconds = Math.max(1, Duration.between(session.getStartedAt(), completedAt).getSeconds());

        int ppeScore = 0;
        int detectionScore = 0;
        int evacuationScore = 0;
        int containmentScore = 0;
        int decontaminationScore = 0;
        int timeBonusScore = 0;
        int totalPenalties = 0;

        List<MistakeDetailDTO> mistakes = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        boolean ppeDonned = false;
        boolean enterWithoutPpeOccurred = false;
        int wrongDrumScans = 0;
        boolean correctLeakIdentified = false;
        int civiliansEvacuatedCount = 0;
        int civiliansLeftBehindCount = 0;
        boolean containmentDone = false;
        boolean deconDone = false;

        for (SessionEvent event : events) {
            String type = event.getEventType();
            String data = event.getEventData();

            switch (type) {
                case "ppe_donning_completed":
                case "ppe_item_equipped":
                    ppeDonned = true;
                    break;

                case "entered_hazard_zone_without_ppe":
                    enterWithoutPpeOccurred = true;
                    totalPenalties += PENALTY_ENTER_WITHOUT_PPE;
                    mistakes.add(MistakeDetailDTO.builder()
                            .stage("PPE Donning / Entry")
                            .description("Entered chemical hazard zone without donning complete CBRN PPE.")
                            .deductionPoints(PENALTY_ENTER_WITHOUT_PPE)
                            .severity("HIGH")
                            .timestamp(event.getTimestamp())
                            .build());
                    break;

                case "leak_source_identified":
                    if (data != null && data.contains(WRONG_SCAN_MARKER) && data.contains(FALSE_VALUE)) {
                        wrongDrumScans++;
                        totalPenalties += PENALTY_WRONG_DRUM_SCAN;
                        mistakes.add(MistakeDetailDTO.builder()
                                .stage("Detection & Identification")
                                .description("Flagged wrong chemical storage drum as leak source.")
                                .deductionPoints(PENALTY_WRONG_DRUM_SCAN)
                                .severity("MEDIUM")
                                .timestamp(event.getTimestamp())
                                .build());
                    } else {
                        correctLeakIdentified = true;
                    }
                    break;

                case "civilian_evacuated":
                    civiliansEvacuatedCount++;
                    break;

                case "evacuation_incomplete":
                    civiliansLeftBehindCount = extractCount(data);
                    break;

                case "containment_completed":
                    containmentDone = true;
                    break;

                case "decontamination_completed":
                    deconDone = true;
                    break;

                default:
                    break;
            }
        }

        // 1. PPE Score
        if (ppeDonned && !enterWithoutPpeOccurred) {
            ppeScore = PPE_MAX_SCORE;
        } else if (ppeDonned) {
            ppeScore = PPE_MAX_SCORE / 2;
        }

        // 2. Detection Score
        if (correctLeakIdentified && wrongDrumScans == 0) {
            detectionScore = DETECTION_MAX_SCORE;
        } else if (correctLeakIdentified) {
            detectionScore = DETECTION_MAX_SCORE / 2;
        }

        // 3. Evacuation Score - full clearance earns max; partial evacuations are
        // scored per civilian but hard-capped so the component can never exceed its budget
        if (civiliansEvacuatedCount >= 2 && civiliansLeftBehindCount == 0) {
            evacuationScore = EVACUATION_MAX_SCORE;
        } else if (civiliansEvacuatedCount > 0) {
            evacuationScore = Math.min(EVACUATION_MAX_SCORE,
                    EVACUATION_SCORE_PER_CIVILIAN * civiliansEvacuatedCount);
        }

        if (civiliansLeftBehindCount > 0) {
            int penalty = PENALTY_CIVILIAN_LEFT_BEHIND * civiliansLeftBehindCount;
            totalPenalties += penalty;
            mistakes.add(MistakeDetailDTO.builder()
                    .stage("Civilian Evacuation")
                    .description("Left " + civiliansLeftBehindCount + " civilian(s) un-evacuated in the danger zone.")
                    .deductionPoints(penalty)
                    .severity("HIGH")
                    .timestamp(completedAt)
                    .build());
        }

        // 4. Containment Score
        if (containmentDone) {
            containmentScore = CONTAINMENT_MAX_SCORE;
        } else {
            totalPenalties += PENALTY_CONTAINMENT_SKIPPED;
            mistakes.add(MistakeDetailDTO.builder()
                    .stage("Hazard Containment")
                    .description("Failed to complete containment sealant protocol on leaking drum.")
                    .deductionPoints(PENALTY_CONTAINMENT_SKIPPED)
                    .severity("HIGH")
                    .timestamp(completedAt)
                    .build());
        }

        // 5. Decontamination Score
        if (deconDone) {
            decontaminationScore = DECONTAMINATION_MAX_SCORE;
        } else {
            totalPenalties += PENALTY_DECON_SKIPPED;
            mistakes.add(MistakeDetailDTO.builder()
                    .stage("Decontamination")
                    .description("Skipped post-operation decontamination station protocol.")
                    .deductionPoints(PENALTY_DECON_SKIPPED)
                    .severity("MEDIUM")
                    .timestamp(completedAt)
                    .build());
        }

        // 6. Time Bonus
        if (durationSeconds <= TIER_EXCELLENT_SECONDS) {
            timeBonusScore = TIME_BONUS_MAX_SCORE;
        } else if (durationSeconds <= TIER_GOOD_SECONDS) {
            timeBonusScore = 15;
        } else if (durationSeconds <= TIER_ACCEPTABLE_SECONDS) {
            timeBonusScore = 10;
        } else {
            timeBonusScore = 5;
        }

        int rawPositive = ppeScore + detectionScore + evacuationScore + containmentScore
                + decontaminationScore + timeBonusScore;
        int netScore = Math.max(0, rawPositive - totalPenalties);
        int finalScore = Math.min(100, (int) Math.round((double) netScore / MAX_RAW_SCORE * 100.0));

        boolean passed = finalScore >= PASS_THRESHOLD;
        String passStatus = session.getPassStatus() != null && !"IN_PROGRESS".equals(session.getPassStatus())
                && session.getCompletedAt() != null
                ? session.getPassStatus()
                : (passed ? "PASSED" : "FAILED");

        if (enterWithoutPpeOccurred) {
            recommendations.add("ALWAYS equip complete CBRN PPE (Mask, Suit, Gloves) before stepping past the hazard perimeter.");
        }
        if (wrongDrumScans > 0) {
            recommendations.add("Verify PID gas detector readings on all storage drums before flagging leak source.");
        }
        if (civiliansLeftBehindCount > 0) {
            recommendations.add("Ensure all non-combatant civilians are escorted to the Safe Zone before initiating containment.");
        }
        if (!deconDone) {
            recommendations.add("Complete mandatory shower decontamination before ending mission to prevent cross-contamination.");
        }
        if (!containmentDone) {
            recommendations.add("Locate and seal the leaking drum with the containment kit before leaving the hazard zone.");
        }
        if (recommendations.isEmpty()) {
            recommendations.add("Excellent response! Full compliance with NDRF Chemical Disaster Standard Operating Procedure.");
        }

        ScoreBreakdownDTO breakdown = ScoreBreakdownDTO.builder()
                .ppeScore(ppeScore)
                .detectionScore(detectionScore)
                .evacuationScore(evacuationScore)
                .containmentScore(containmentScore)
                .decontaminationScore(decontaminationScore)
                .timeBonusScore(timeBonusScore)
                .totalPenalties(totalPenalties)
                .netScore(netScore)
                .build();

        return ScoreReportDTO.builder()
                .sessionId(session.getSessionId())
                .traineeId(session.getTraineeId())
                .traineeName(trainee.getName())
                .batchUnit(trainee.getBatchUnit())
                .scenarioCode(scenario.getCode())
                .scenarioTitle(scenario.getTitle())
                .startedAt(session.getStartedAt())
                .completedAt(completedAt)
                .totalDurationSeconds(durationSeconds)
                .finalScore(finalScore)
                .passStatus(passStatus)
                .passed(passed)
                .breakdown(breakdown)
                .mistakes(mistakes)
                .recommendations(recommendations)
                .build();
    }

    /**
     * Safely extract a numeric "count" value from JSON-like event data.
     * Uses simple string parsing instead of regex to avoid ReDoS vulnerabilities.
     */
    private int extractCount(String eventData) {
        if (eventData == null || !eventData.contains(COUNT_FIELD_KEY)) {
            return 1;
        }
        try {
            int keyIdx = eventData.indexOf(COUNT_FIELD_KEY);
            if (keyIdx < 0) return 1;
            int colonIdx = eventData.indexOf(':', keyIdx + COUNT_FIELD_KEY.length());
            if (colonIdx < 0) return 1;
            int start = colonIdx + 1;
            // Skip whitespace
            while (start < eventData.length() && Character.isWhitespace(eventData.charAt(start))) {
                start++;
            }
            // Read digits
            int end = start;
            while (end < eventData.length() && Character.isDigit(eventData.charAt(end))) {
                end++;
            }
            if (end > start) {
                return Integer.parseInt(eventData.substring(start, end));
            }
        } catch (Exception ignored) {
            // Return default on any parsing error
        }
        return 1;
    }
}

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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoringService {

    private static final Logger log = LoggerFactory.getLogger(ScoringService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final EventRepository eventRepository;
    private final SessionRepository sessionRepository;
    private final TraineeRepository traineeRepository;
    private final ScenarioRepository scenarioRepository;

    public static final int PASS_THRESHOLD = 70;

    @Transactional
    public ScoreReportDTO calculateAndFinalizeScore(String sessionId) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        Trainee trainee = traineeRepository.findById(session.getTraineeId())
                .orElse(Trainee.builder().name("Unknown Trainee").batchUnit("NDRF Unit 1").build());

        Scenario scenario = scenarioRepository.findById(session.getScenarioId())
                .orElse(Scenario.builder().code("CBRN-CHEM-01").title("Chemical Spill Emergency").build());

        List<SessionEvent> events = eventRepository.findBySessionIdOrderByTimestampAsc(sessionId);

        Instant completedAt = session.getCompletedAt() != null ? session.getCompletedAt() : Instant.now();
        if (session.getCompletedAt() == null) {
            session.setCompletedAt(completedAt);
        }

        long durationSeconds = Math.max(1, Duration.between(session.getStartedAt(), completedAt).getSeconds());

        // Scoring components
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
        int unrecognizedEventCount = 0;

        // Process event stream
        for (SessionEvent event : events) {
            String type = event.getEventType();

            switch (type) {
                case "ppe_donning_completed":
                case "ppe_item_equipped":
                    ppeDonned = true;
                    break;

                case "entered_hazard_zone_without_ppe":
                    enterWithoutPpeOccurred = true;
                    totalPenalties += 15;
                    mistakes.add(MistakeDetailDTO.builder()
                            .stage("PPE Donning / Entry")
                            .description("Entered chemical hazard zone without donning complete CBRN PPE.")
                            .deductionPoints(15)
                            .severity("HIGH")
                            .timestamp(event.getTimestamp())
                            .build());
                    break;

                case "leak_source_identified":
                    if (event.getEventData() != null && event.getEventData().contains("\"correct\":false")) {
                        wrongDrumScans++;
                        totalPenalties += 5;
                        mistakes.add(MistakeDetailDTO.builder()
                                .stage("Detection & Identification")
                                .description("Flagged wrong chemical storage drum as leak source.")
                                .deductionPoints(5)
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
                    // Parse left behind count from JSON payload using Jackson
                    civiliansLeftBehindCount = 1;
                    if (event.getEventData() != null) {
                        try {
                            JsonNode node = objectMapper.readTree(event.getEventData());
                            JsonNode countNode = node.get("count");
                            if (countNode != null && countNode.isNumber()) {
                                civiliansLeftBehindCount = countNode.asInt();
                            }
                        } catch (Exception e) {
                            log.warn("Failed to parse evacuation_incomplete event data, defaulting count to 1: {}", e.getMessage());
                        }
                    }
                    break;

                case "containment_completed":
                    containmentDone = true;
                    break;

                case "decontamination_completed":
                    deconDone = true;
                    break;

                default:
                    unrecognizedEventCount++;
                    log.warn("Unrecognized event type encountered: '{}' in session '{}'", type, sessionId);
                    break;
            }
        }

        // 1. PPE Score
        if (ppeDonned && !enterWithoutPpeOccurred) {
            ppeScore = 10;
        } else if (ppeDonned) {
            ppeScore = 5;
        }

        // 2. Detection Score
        if (correctLeakIdentified && wrongDrumScans == 0) {
            detectionScore = 10;
        } else if (correctLeakIdentified) {
            detectionScore = 5;
        }

        // 3. Evacuation Score
        if (civiliansEvacuatedCount >= 2 && civiliansLeftBehindCount == 0) {
            evacuationScore = 15;
        } else if (civiliansEvacuatedCount > 0) {
            evacuationScore = 5 * civiliansEvacuatedCount;
        }

        if (civiliansLeftBehindCount > 0) {
            int penalty = 10 * civiliansLeftBehindCount;
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
            containmentScore = 15;
        } else {
            mistakes.add(MistakeDetailDTO.builder()
                    .stage("Hazard Containment")
                    .description("Failed to complete containment sealant protocol on leaking drum.")
                    .deductionPoints(15)
                    .severity("HIGH")
                    .timestamp(completedAt)
                    .build());
        }

        // 5. Decontamination Score
        if (deconDone) {
            decontaminationScore = 10;
        } else {
            totalPenalties += 10;
            mistakes.add(MistakeDetailDTO.builder()
                    .stage("Decontamination")
                    .description("Skipped post-operation decontamination station protocol.")
                    .deductionPoints(10)
                    .severity("MEDIUM")
                    .timestamp(completedAt)
                    .build());
        }

        // 6. Time Bonus
        if (durationSeconds <= 180) {
            timeBonusScore = 20;
        } else if (durationSeconds <= 300) {
            timeBonusScore = 15;
        } else if (durationSeconds <= 450) {
            timeBonusScore = 10;
        } else {
            timeBonusScore = 5;
        }

        // Raw Total & Final Normalized Score (80 max achievable raw points = 100 final score)
        int rawPositive = ppeScore + detectionScore + evacuationScore + containmentScore + decontaminationScore + timeBonusScore;
        int netScore = Math.max(0, rawPositive - totalPenalties);
        int finalScore = Math.min(100, (int) Math.round((double) netScore / 80.0 * 100.0));

        String passStatus = finalScore >= PASS_THRESHOLD ? "PASSED" : "FAILED";

        // Save session final score & status
        session.setFinalScore(finalScore);
        session.setPassStatus(passStatus);
        sessionRepository.save(session);

        // Generate tailored recommendations
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
                .rawTotalScore(netScore)
                .build();

        return ScoreReportDTO.builder()
                .sessionId(sessionId)
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
                .passed(finalScore >= PASS_THRESHOLD)
                .breakdown(breakdown)
                .mistakes(mistakes)
                .recommendations(recommendations)
                .unrecognizedEventCount(unrecognizedEventCount)
                .build();
    }
}

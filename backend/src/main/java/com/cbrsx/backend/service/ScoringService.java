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

    private final EventRepository eventRepository;
    private final SessionRepository sessionRepository;
    private final TraineeRepository traineeRepository;
    private final ScenarioRepository scenarioRepository;
    private final ObjectMapper objectMapper;

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
        int unrecognizedEventCount = 0;

        String scenarioCode = scenario.getCode() != null ? scenario.getCode().toUpperCase() : "CBRN-CHEM-01";
        boolean isRad = scenarioCode.contains("RAD");
        boolean isBio = scenarioCode.contains("BIO");

        for (SessionEvent event : events) {
            String type = event.getEventType();
            String data = event.getEventData();

            switch (type) {
                // 1. PPE Donning Events (Chem Level-A / Rad Shielding / Bio PAPR)
                case "ppe_donning_completed":
                case "ppe_item_equipped":
                case "lead_apron_equipped":
                case "papr_donning_completed":
                    ppeDonned = true;
                    break;

                case "entered_hazard_zone_without_ppe":
                    enterWithoutPpeOccurred = true;
                    totalPenalties += PENALTY_ENTER_WITHOUT_PPE;
                    mistakes.add(MistakeDetailDTO.builder()
                            .stage("PPE Donning / Entry")
                            .description(isRad ? "Entered radiological vault hot cell without radiation shielding & dosimeter."
                                    : (isBio ? "Entered Level-4 bio-containment without active PAPR respirator."
                                    : "Entered chemical hazard zone without donning complete CBRN PPE."))
                            .deductionPoints(PENALTY_ENTER_WITHOUT_PPE)
                            .severity("HIGH")
                            .timestamp(event.getTimestamp())
                            .build());
                    break;

                // 2. Hazard Detection & Triangulation Events
                case "detector_equipped":
                case "dosimeter_equipped":
                case "bio_sampler_equipped":
                    // Benign calibration / equipment setup
                    break;

                case "leak_source_identified":
                case "rad_source_identified":
                case "pathogen_breach_identified":
                    if (isWrongScan(data)) {
                        wrongDrumScans++;
                        totalPenalties += PENALTY_WRONG_DRUM_SCAN;
                        mistakes.add(MistakeDetailDTO.builder()
                                .stage("Detection & Identification")
                                .description(isRad ? "Flagged uncompromised container as radiation leak source."
                                        : (isBio ? "Flagged sterile culture chamber as pathogen breach origin."
                                        : "Flagged wrong chemical storage drum as leak source."))
                                .deductionPoints(PENALTY_WRONG_DRUM_SCAN)
                                .severity("MEDIUM")
                                .timestamp(event.getTimestamp())
                                .build());
                    } else {
                        correctLeakIdentified = true;
                    }
                    break;

                // 3. Search & Rescue / Evacuation Events
                case "civilian_evacuated":
                case "technician_extracted":
                case "lab_personnel_evacuated":
                    civiliansEvacuatedCount++;
                    break;

                case "evacuation_incomplete":
                    civiliansLeftBehindCount = extractCount(data);
                    break;

                // 4. Containment Events
                case "containment_completed":
                case "shielding_blanket_deployed":
                case "hot_cell_isolated":
                case "airlock_sealed":
                case "negative_pressure_engaged":
                    containmentDone = true;
                    break;

                // 5. Decontamination Events
                case "decontamination_completed":
                case "rad_washdown_completed":
                case "autoclave_sterilization_completed":
                case "bio_misting_completed":
                    deconDone = true;
                    break;

                // Benign telemetry events
                case "scenario_started":
                case "scenario_completed":
                case "trainee_heartbeat":
                case "spatial_telemetry":
                    break;

                default:
                    unrecognizedEventCount++;
                    log.warn("Unrecognized event type encountered: '{}' in session '{}'", type, session.getSessionId());
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

        // 3. Evacuation Score
        if (civiliansEvacuatedCount >= 2 && civiliansLeftBehindCount == 0) {
            evacuationScore = EVACUATION_MAX_SCORE;
        } else if (civiliansEvacuatedCount > 0) {
            evacuationScore = Math.min(EVACUATION_MAX_SCORE,
                    EVACUATION_SCORE_PER_CIVILIAN * civiliansEvacuatedCount);
        }

        if (civiliansLeftBehindCount > 0) {
            // [SEC-02] Cap individual penalty to prevent overflow from inflated counts
            int penalty = Math.min(PENALTY_CIVILIAN_LEFT_BEHIND * civiliansLeftBehindCount, 100);
            totalPenalties = Math.min(totalPenalties + penalty, 500);
            mistakes.add(MistakeDetailDTO.builder()
                    .stage(isRad ? "Personnel Evacuation" : (isBio ? "Lab Personnel Extraction" : "Civilian Evacuation"))
                    .description("Left " + civiliansLeftBehindCount + (isRad || isBio ? " casualty/personnel" : " civilian(s)") + " un-evacuated in the danger zone.")
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
                    .description(isRad ? "Failed to deploy lead shielding blanket over radiation source."
                            : (isBio ? "Failed to seal negative pressure airlock containment perimeter."
                            : "Failed to complete containment sealant protocol on leaking drum."))
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
                    .description(isRad ? "Skipped mandatory post-operation radiological washdown & dosimeter zeroing."
                            : (isBio ? "Skipped autoclave sterilization and aerosol neutralizer misting cycle."
                            : "Skipped post-operation decontamination station protocol."))
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

        // Scenario-Specific Operational Recommendations
        if (enterWithoutPpeOccurred) {
            recommendations.add(isRad ? "ALWAYS don full lead shielding apron and personal dosimeter before entering the vault."
                    : (isBio ? "ALWAYS verify PAPR airflow and negative pressure seal before breaching bio-lab."
                    : "ALWAYS equip complete CBRN PPE (Mask, Suit, Gloves) before stepping past the hazard perimeter."));
        }
        if (wrongDrumScans > 0) {
            recommendations.add(isRad ? "Verify survey dosimeter and gamma spectrum peak before flagging isotope container."
                    : (isBio ? "Verify bio-sampler aerosol concentration spikes before tagging pathogen breach origin."
                    : "Verify PID gas detector readings on all storage drums before flagging leak source."));
        }
        if (civiliansLeftBehindCount > 0) {
            recommendations.add("Ensure all casualties and personnel are safely escorted to the green triage staging zone.");
        }
        if (!containmentDone) {
            recommendations.add(isRad ? "Deploy lead shielding blanket directly over the Cesium-137 capsule before mission completion."
                    : (isBio ? "Engage negative pressure airlock and secure all bio-containment dampers."
                    : "Locate and seal the leaking drum with the containment kit before leaving the hazard zone."));
        }
        if (!deconDone) {
            recommendations.add(isRad ? "Complete 3-stage radiological washdown and dosimeter zeroing before debrief."
                    : (isBio ? "Execute full autoclave sterilization and bio-aerosol neutralizer cycle."
                    : "Complete mandatory shower decontamination before ending mission to prevent cross-contamination."));
        }
        if (recommendations.isEmpty()) {
            recommendations.add(isRad ? "Flawless radiological execution! Full compliance with NDRF Nuclear/Radiological Disaster SOP."
                    : (isBio ? "Flawless biological containment! Full compliance with Level-4 Biosafety Emergency SOP."
                    : "Excellent response! Full compliance with NDRF Chemical Disaster Standard Operating Procedure."));
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
                .unrecognizedEventCount(unrecognizedEventCount)
                .build();
    }

    /**
     * Safely extract a numeric "count" value from JSON event data.
     * Uses Jackson ObjectMapper with fallback, hard-clamping to [1, 50] to prevent
     * score manipulation or integer overflow in penalty computations.
     */
    private int extractCount(String eventData) {
        if (eventData == null || eventData.isBlank()) {
            return 1;
        }
        try {
            JsonNode root = objectMapper.readTree(eventData);
            if (root.has("count") && root.get("count").isNumber()) {
                long val = root.get("count").asLong();
                return (int) Math.min(Math.max(val, 1), 50);
            }
        } catch (Exception e) {
            log.debug("Standard JSON parsing failed for eventData, trying string fallback: {}", e.getMessage());
        }

        // Fallback string-based extraction if eventData is raw key-value or partial
        try {
            if (eventData.contains(COUNT_FIELD_KEY)) {
                int keyIdx = eventData.indexOf(COUNT_FIELD_KEY);
                int colonIdx = eventData.indexOf(':', keyIdx + COUNT_FIELD_KEY.length());
                if (colonIdx > 0) {
                    int start = colonIdx + 1;
                    while (start < eventData.length() && Character.isWhitespace(eventData.charAt(start))) {
                        start++;
                    }
                    int end = start;
                    int maxDigits = Math.min(start + 10, eventData.length());
                    while (end < maxDigits && Character.isDigit(eventData.charAt(end))) {
                        end++;
                    }
                    if (end > start) {
                        long parsed = Long.parseLong(eventData.substring(start, end));
                        return (int) Math.min(Math.max(parsed, 1), 50);
                    }
                }
            }
        } catch (Exception ignored) {}

        return 1;
    }

    /**
     * Safely checks whether an event data JSON payload indicates a false-positive / wrong scan.
     * Uses Jackson ObjectMapper with resilient fallback to substring search.
     */
    private boolean isWrongScan(String eventData) {
        if (eventData == null || eventData.isBlank()) {
            return false;
        }
        try {
            JsonNode root = objectMapper.readTree(eventData);
            if (root.has("correct")) {
                JsonNode correctNode = root.get("correct");
                if (correctNode.isBoolean()) {
                    return !correctNode.asBoolean();
                } else if (correctNode.isTextual()) {
                    return "false".equalsIgnoreCase(correctNode.asText());
                } else if (correctNode.isNumber()) {
                    return correctNode.asInt() == 0;
                }
            }
        } catch (Exception e) {
            log.debug("Standard JSON parsing failed for wrong-scan check, trying fallback: {}", e.getMessage());
        }
        return eventData.contains(WRONG_SCAN_MARKER) && eventData.contains(FALSE_VALUE);
    }
}

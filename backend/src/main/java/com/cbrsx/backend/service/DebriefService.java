package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.DebriefReportDTO;
import com.cbrsx.backend.dto.MistakeDetailDTO;
import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.entity.SessionEvent;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.EventRepository;
import com.cbrsx.backend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Intelligent After-Action Review (AAR) and Debriefing Engine.
 * Analyzes mission timeline sequences, operator decision latency, mistake severity,
 * and compiles comprehensive tactical NDRF operational guidance.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DebriefService {

    private final ScoringService scoringService;
    private final EventRepository eventRepository;
    private final SessionRepository sessionRepository;

    @Transactional(readOnly = true)
    public DebriefReportDTO generateDebrief(String sessionId) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        ScoreReportDTO report = scoringService.previewScore(sessionId);
        List<SessionEvent> events = eventRepository.findBySessionIdOrderByTimestampAsc(sessionId);

        // 1. Compute Tactical Rating
        int score = report.getFinalScore();
        boolean passed = report.isPassed();
        String tacticalRating;
        if (score >= 95) {
            tacticalRating = "ALPHA (Elite HAZMAT Specialist)";
        } else if (score >= 85) {
            tacticalRating = "BRAVO (Combat Effective Responder)";
        } else if (score >= 70) {
            tacticalRating = "CHARLIE (Marginal Operational Pass)";
        } else if (score >= 50) {
            tacticalRating = "DELTA (Compromised - Procedural Failures)";
        } else {
            tacticalRating = "FATAL (Mission Critical Breakdown)";
        }

        // 2. Compute Response Velocity Assessment
        long duration = report.getTotalDurationSeconds();
        String velocityAssessment;
        if (duration <= ScoringService.TIER_EXCELLENT_SECONDS) {
            velocityAssessment = String.format("RAPID NEUTRALIZATION (%d sec) — Completed well within the 3-minute golden hour window. Minimal atmospheric plume propagation.", duration);
        } else if (duration <= ScoringService.TIER_GOOD_SECONDS) {
            velocityAssessment = String.format("TACTICALLY SOUND SPEED (%d sec) — Handled within 5 minutes. Controlled dispersion profile.", duration);
        } else if (duration <= ScoringService.TIER_ACCEPTABLE_SECONDS) {
            velocityAssessment = String.format("DELAYED RESPONSE (%d sec) — Hazard contained between 5 to 7.5 minutes. Elevated transdermal and vapor inhalation risk.", duration);
        } else {
            velocityAssessment = String.format("CRITICALLY PROLONGED (%d sec) — Over 7.5 minutes elapsed. Severe ambient toxic contamination of surrounding perimeter.", duration);
        }

        // 3. Extract Operational Strengths
        List<String> strengths = new ArrayList<>();
        if (report.getBreakdown().getPpeScore() == ScoringService.PPE_MAX_SCORE) {
            strengths.add("Flawless PPE Integrity: Full Level-A protective suit and positive pressure SCBA donned prior to hazardous hot zone penetration.");
        }
        if (report.getBreakdown().getDetectionScore() == ScoringService.DETECTION_MAX_SCORE) {
            strengths.add("Precision Photoionization Detection: Pinpointed leaking chemical vessel with zero false positive drum triggers.");
        }
        if (report.getBreakdown().getEvacuationScore() == ScoringService.EVACUATION_MAX_SCORE) {
            strengths.add("100% Civilian Extraction: Safely escorted all trapped non-combatants to green staging coordinates prior to containment.");
        }
        if (report.getBreakdown().getContainmentScore() == ScoringService.CONTAINMENT_MAX_SCORE) {
            strengths.add("Effective Hazard Sealing: Successfully secured the compromised valve with the polymer containment compression clamp.");
        }
        if (report.getBreakdown().getDecontaminationScore() == ScoringService.DECONTAMINATION_MAX_SCORE) {
            strengths.add("Sanitization Compliance: Completed mandatory 3-stage chemical shower cycle to avoid secondary staging cross-contamination.");
        }
        if (strengths.isEmpty()) {
            strengths.add("Demonstrated core emergency awareness by initiating scenario protocols under simulated pressure.");
        }

        // 4. Extract Tactical Vulnerabilities
        List<String> vulnerabilities = new ArrayList<>();
        for (MistakeDetailDTO mistake : report.getMistakes()) {
            vulnerabilities.add(String.format("[%s - %s Severity] %s (-%d pts)",
                    mistake.getStage(), mistake.getSeverity(), mistake.getDescription(), mistake.getDeductionPoints()));
        }
        if (vulnerabilities.isEmpty()) {
            vulnerabilities.add("No procedural safety violations or tactical protocol infractions detected during this operation.");
        }

        // 5. Build Chronological Timeline Milestones
        List<DebriefReportDTO.TimelineMilestoneDTO> timeline = new ArrayList<>();
        Instant lastTime = session.getStartedAt();
        for (SessionEvent event : events) {
            String eval = evaluateEvent(event);
            String status = determineEventStatus(event);
            timeline.add(DebriefReportDTO.TimelineMilestoneDTO.builder()
                    .stage(mapEventTypeToStage(event.getEventType()))
                    .eventType(event.getEventType())
                    .status(status)
                    .evaluation(eval)
                    .timestamp(event.getTimestamp())
                    .build());
        }

        // 6. Formulate Actionable NDRF SOP Action Plan
        List<String> actionPlan = new ArrayList<>();
        if (!passed) {
            actionPlan.add("MANDATORY RETRAINING REQUIRED: Trainee must complete 3 supervised runs on Chemical Incident Module (CBRN-CHEM-01) with instructor sign-off.");
        }
        if (report.getMistakes().stream().anyMatch(m -> m.getStage().contains("PPE"))) {
            actionPlan.add("DRILL SOP 4.1: Level-A Hazmat Suit Donning Cross-Check. Practice buddy-system pressure seal verification before entering hazard perimeter.");
        }
        if (report.getMistakes().stream().anyMatch(m -> m.getStage().contains("Detection"))) {
            actionPlan.add("DRILL SOP 5.3: Photoionization Detector (PID) Calibration & Gradient Reading. Reinforce reading VOC ppm spikes near seams versus ambient air.");
        }
        if (report.getMistakes().stream().anyMatch(m -> m.getStage().contains("Evacuation"))) {
            actionPlan.add("DRILL SOP 6.2: Rapid Casualty Triaging & Perimeter Clearance. Prioritize human extraction before initiating heavy containment clamping.");
        }
        if (report.getMistakes().stream().anyMatch(m -> m.getStage().contains("Containment"))) {
            actionPlan.add("DRILL SOP 7.4: Rapid Drum Clamp & Epoxy Patch Placement under zero-visibility conditions.");
        }
        if (report.getMistakes().stream().anyMatch(m -> m.getStage().contains("Decontamination"))) {
            actionPlan.add("DRILL SOP 8.1: Controlled 3-Stage Decontamination and runoff disposal protocol.");
        }
        if (actionPlan.isEmpty()) {
            actionPlan.add("CONTINUE ADVANCED CERTIFICATION: Responder is certified combat-ready for Level-4 Chemical Incident operations.");
            actionPlan.add("RECOMMENDED NEXT MODULE: Advance to CBRN-RAD-02 (Radiological Dirty Bomb & Isotope Containment).");
        }

        // 7. Generate Executive Summary Narrative
        String summary = String.format(
                "Trainee %s (%s) completed scenario %s with a Final Score of %d/100 (%s). " +
                "The operation was executed with a Tactical Rating of %s. %s " +
                "Identified %d operational strength(s) and %d procedural vulnerability(ies).",
                report.getTraineeName(), report.getBatchUnit(), report.getScenarioCode(),
                score, report.getPassStatus(), tacticalRating, velocityAssessment,
                strengths.size(), report.getMistakes().size()
        );

        return DebriefReportDTO.builder()
                .sessionId(report.getSessionId())
                .traineeId(report.getTraineeId())
                .traineeName(report.getTraineeName())
                .batchUnit(report.getBatchUnit())
                .scenarioCode(report.getScenarioCode())
                .scenarioTitle(report.getScenarioTitle())
                .finalScore(report.getFinalScore())
                .passStatus(report.getPassStatus())
                .passed(passed)
                .tacticalRating(tacticalRating)
                .executiveSummary(summary)
                .responseVelocityAssessment(velocityAssessment)
                .operationalStrengths(strengths)
                .tacticalVulnerabilities(vulnerabilities)
                .timelineAnalysis(timeline)
                .ndrfActionPlan(actionPlan)
                .generatedAt(Instant.now())
                .build();
    }

    private String mapEventTypeToStage(String eventType) {
        if (eventType == null) return "Unknown";
        switch (eventType) {
            case "scenario_started": return "Incident Authorization";
            case "ppe_donning_completed":
            case "ppe_item_equipped":
            case "entered_hazard_zone_without_ppe": return "PPE Donning & Perimeter Check";
            case "detector_equipped":
            case "leak_source_identified": return "Hazard Detection & PID Triangulation";
            case "civilian_evacuated":
            case "evacuation_incomplete": return "Search & Rescue / Evacuation";
            case "containment_completed": return "Hazard Sealing & Containment";
            case "decontamination_completed": return "Decontamination & Exit";
            case "scenario_completed": return "Mission Debrief";
            default: return "Tactical Action";
        }
    }

    private String determineEventStatus(String eventType) {
        if (eventType == null) return "INFO";
        if (eventType.contains("without_ppe") || eventType.contains("incomplete")) return "VIOLATION";
        if (eventType.contains("completed") || eventType.contains("equipped") || eventType.contains("evacuated")) return "SUCCESS";
        return "INFO";
    }

    private String determineEventStatus(SessionEvent event) {
        String type = event.getEventType();
        String data = event.getEventData();
        if (type == null) return "INFO";
        if ("entered_hazard_zone_without_ppe".equals(type) || "evacuation_incomplete".equals(type)) {
            return "VIOLATION";
        }
        if ("leak_source_identified".equals(type) && data != null && data.contains("\"correct\"") && data.contains("false")) {
            return "WARNING";
        }
        if (type.contains("completed") || type.contains("equipped") || type.contains("evacuated") || type.contains("identified")) {
            return "SUCCESS";
        }
        return "INFO";
    }

    private String evaluateEvent(SessionEvent event) {
        String type = event.getEventType();
        String data = event.getEventData();
        if (type == null) return "Operational telemetry logged.";
        switch (type) {
            case "scenario_started":
                return "Incident command initialized mission clock.";
            case "ppe_donning_completed":
                return "Complete CBRN Level-A ensemble donned and verified.";
            case "entered_hazard_zone_without_ppe":
                return "CRITICAL VIOLATION: Stepped across hot zone threshold without respiratory protection.";
            case "detector_equipped":
                return "Photoionization PID detector powered on and calibrated.";
            case "leak_source_identified":
                if (data != null && data.contains("\"correct\"") && data.contains("false")) {
                    return "WARNING: Scanned incorrect storage drum (false positive identification).";
                }
                return "Correct leaking chemical drum identified through VOC ppm gradient.";
            case "civilian_evacuated":
                return "Civilian casualty safely transported to green staging zone.";
            case "evacuation_incomplete":
                return "WARNING: Non-combatant personnel remained unaccounted for in danger sector.";
            case "containment_completed":
                return "Polymer seal clamp deployed to halt continuous chemical release.";
            case "decontamination_completed":
                return "High-pressure neutralizer shower cycle executed successfully.";
            case "scenario_completed":
                return "Responder checked out at incident command post.";
            default:
                return "Tactical telemetry event recorded.";
        }
    }
}

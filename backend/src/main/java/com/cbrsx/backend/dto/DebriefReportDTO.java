package com.cbrsx.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Data Transfer Object containing the AI Tactical After-Action Review (AAR).
 * Evaluates operator behavior, timeline intervals, safety compliance, and NDRF SOP adherence.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebriefReportDTO {

    private String sessionId;
    private String traineeId;
    private String traineeName;
    private String batchUnit;
    private String scenarioCode;
    private String scenarioTitle;
    private int finalScore;
    private String passStatus;
    private boolean passed;

    private String tacticalRating; // e.g. "ALPHA (Superior)", "BRAVO (Combat Effective)", "CHARLIE (Marginal)", "DELTA (Compromised)"
    private String executiveSummary;
    private String responseVelocityAssessment;

    private List<String> operationalStrengths;
    private List<String> tacticalVulnerabilities;
    private List<TimelineMilestoneDTO> timelineAnalysis;
    private List<String> ndrfActionPlan;

    private Instant generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineMilestoneDTO {
        private String stage;
        private String eventType;
        private String status; // "SUCCESS", "VIOLATION", "WARNING", "INFO"
        private String evaluation;
        private Instant timestamp;
    }
}

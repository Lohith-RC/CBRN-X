package com.cbrsx.backend.dto;

import java.time.Instant;
import java.util.List;

/**
 * Data Transfer Object containing the AI Tactical After-Action Review (AAR).
 * Evaluates operator behavior, timeline intervals, safety compliance, and NDRF SOP adherence.
 */
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

    public DebriefReportDTO() {}

    public DebriefReportDTO(String sessionId, String traineeId, String traineeName, String batchUnit,
                            String scenarioCode, String scenarioTitle, int finalScore, String passStatus,
                            boolean passed, String tacticalRating, String executiveSummary,
                            String responseVelocityAssessment, List<String> operationalStrengths,
                            List<String> tacticalVulnerabilities, List<TimelineMilestoneDTO> timelineAnalysis,
                            List<String> ndrfActionPlan, Instant generatedAt) {
        this.sessionId = sessionId;
        this.traineeId = traineeId;
        this.traineeName = traineeName;
        this.batchUnit = batchUnit;
        this.scenarioCode = scenarioCode;
        this.scenarioTitle = scenarioTitle;
        this.finalScore = finalScore;
        this.passStatus = passStatus;
        this.passed = passed;
        this.tacticalRating = tacticalRating;
        this.executiveSummary = executiveSummary;
        this.responseVelocityAssessment = responseVelocityAssessment;
        this.operationalStrengths = operationalStrengths;
        this.tacticalVulnerabilities = tacticalVulnerabilities;
        this.timelineAnalysis = timelineAnalysis;
        this.ndrfActionPlan = ndrfActionPlan;
        this.generatedAt = generatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getTraineeId() { return traineeId; }
    public void setTraineeId(String traineeId) { this.traineeId = traineeId; }

    public String getTraineeName() { return traineeName; }
    public void setTraineeName(String traineeName) { this.traineeName = traineeName; }

    public String getBatchUnit() { return batchUnit; }
    public void setBatchUnit(String batchUnit) { this.batchUnit = batchUnit; }

    public String getScenarioCode() { return scenarioCode; }
    public void setScenarioCode(String scenarioCode) { this.scenarioCode = scenarioCode; }

    public String getScenarioTitle() { return scenarioTitle; }
    public void setScenarioTitle(String scenarioTitle) { this.scenarioTitle = scenarioTitle; }

    public int getFinalScore() { return finalScore; }
    public void setFinalScore(int finalScore) { this.finalScore = finalScore; }

    public String getPassStatus() { return passStatus; }
    public void setPassStatus(String passStatus) { this.passStatus = passStatus; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public String getTacticalRating() { return tacticalRating; }
    public void setTacticalRating(String tacticalRating) { this.tacticalRating = tacticalRating; }

    public String getExecutiveSummary() { return executiveSummary; }
    public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }

    public String getResponseVelocityAssessment() { return responseVelocityAssessment; }
    public void setResponseVelocityAssessment(String responseVelocityAssessment) { this.responseVelocityAssessment = responseVelocityAssessment; }

    public List<String> getOperationalStrengths() { return operationalStrengths; }
    public void setOperationalStrengths(List<String> operationalStrengths) { this.operationalStrengths = operationalStrengths; }

    public List<String> getTacticalVulnerabilities() { return tacticalVulnerabilities; }
    public void setTacticalVulnerabilities(List<String> tacticalVulnerabilities) { this.tacticalVulnerabilities = tacticalVulnerabilities; }

    public List<TimelineMilestoneDTO> getTimelineAnalysis() { return timelineAnalysis; }
    public void setTimelineAnalysis(List<TimelineMilestoneDTO> timelineAnalysis) { this.timelineAnalysis = timelineAnalysis; }

    public List<String> getNdrfActionPlan() { return ndrfActionPlan; }
    public void setNdrfActionPlan(List<String> ndrfActionPlan) { this.ndrfActionPlan = ndrfActionPlan; }

    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }

    public static class Builder {
        private String sessionId;
        private String traineeId;
        private String traineeName;
        private String batchUnit;
        private String scenarioCode;
        private String scenarioTitle;
        private int finalScore;
        private String passStatus;
        private boolean passed;
        private String tacticalRating;
        private String executiveSummary;
        private String responseVelocityAssessment;
        private List<String> operationalStrengths;
        private List<String> tacticalVulnerabilities;
        private List<TimelineMilestoneDTO> timelineAnalysis;
        private List<String> ndrfActionPlan;
        private Instant generatedAt;

        public Builder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
        public Builder traineeId(String traineeId) { this.traineeId = traineeId; return this; }
        public Builder traineeName(String traineeName) { this.traineeName = traineeName; return this; }
        public Builder batchUnit(String batchUnit) { this.batchUnit = batchUnit; return this; }
        public Builder scenarioCode(String scenarioCode) { this.scenarioCode = scenarioCode; return this; }
        public Builder scenarioTitle(String scenarioTitle) { this.scenarioTitle = scenarioTitle; return this; }
        public Builder finalScore(int finalScore) { this.finalScore = finalScore; return this; }
        public Builder passStatus(String passStatus) { this.passStatus = passStatus; return this; }
        public Builder passed(boolean passed) { this.passed = passed; return this; }
        public Builder tacticalRating(String tacticalRating) { this.tacticalRating = tacticalRating; return this; }
        public Builder executiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; return this; }
        public Builder responseVelocityAssessment(String responseVelocityAssessment) { this.responseVelocityAssessment = responseVelocityAssessment; return this; }
        public Builder operationalStrengths(List<String> operationalStrengths) { this.operationalStrengths = operationalStrengths; return this; }
        public Builder tacticalVulnerabilities(List<String> tacticalVulnerabilities) { this.tacticalVulnerabilities = tacticalVulnerabilities; return this; }
        public Builder timelineAnalysis(List<TimelineMilestoneDTO> timelineAnalysis) { this.timelineAnalysis = timelineAnalysis; return this; }
        public Builder ndrfActionPlan(List<String> ndrfActionPlan) { this.ndrfActionPlan = ndrfActionPlan; return this; }
        public Builder generatedAt(Instant generatedAt) { this.generatedAt = generatedAt; return this; }

        public DebriefReportDTO build() {
            return new DebriefReportDTO(sessionId, traineeId, traineeName, batchUnit, scenarioCode, scenarioTitle,
                    finalScore, passStatus, passed, tacticalRating, executiveSummary, responseVelocityAssessment,
                    operationalStrengths, tacticalVulnerabilities, timelineAnalysis, ndrfActionPlan, generatedAt);
        }
    }

    public static class TimelineMilestoneDTO {
        private String stage;
        private String eventType;
        private String status; // "SUCCESS", "VIOLATION", "WARNING", "INFO"
        private String evaluation;
        private Instant timestamp;

        public TimelineMilestoneDTO() {}

        public TimelineMilestoneDTO(String stage, String eventType, String status, String evaluation, Instant timestamp) {
            this.stage = stage;
            this.eventType = eventType;
            this.status = status;
            this.evaluation = evaluation;
            this.timestamp = timestamp;
        }

        public static MilestoneBuilder builder() {
            return new MilestoneBuilder();
        }

        public String getStage() { return stage; }
        public void setStage(String stage) { this.stage = stage; }

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getEvaluation() { return evaluation; }
        public void setEvaluation(String evaluation) { this.evaluation = evaluation; }

        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

        public static class MilestoneBuilder {
            private String stage;
            private String eventType;
            private String status;
            private String evaluation;
            private Instant timestamp;

            public MilestoneBuilder stage(String stage) { this.stage = stage; return this; }
            public MilestoneBuilder eventType(String eventType) { this.eventType = eventType; return this; }
            public MilestoneBuilder status(String status) { this.status = status; return this; }
            public MilestoneBuilder evaluation(String evaluation) { this.evaluation = evaluation; return this; }
            public MilestoneBuilder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }

            public TimelineMilestoneDTO build() {
                return new TimelineMilestoneDTO(stage, eventType, status, evaluation, timestamp);
            }
        }
    }
}

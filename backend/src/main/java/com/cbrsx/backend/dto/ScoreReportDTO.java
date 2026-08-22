package com.cbrsx.backend.dto;

import java.time.Instant;
import java.util.List;

public class ScoreReportDTO {
    private String sessionId;
    private String traineeId;
    private String traineeName;
    private String batchUnit;
    private String scenarioCode;
    private String scenarioTitle;

    private Instant startedAt;
    private Instant completedAt;
    private long totalDurationSeconds;

    private int finalScore;
    private String passStatus;
    private boolean passed;

    private ScoreBreakdownDTO breakdown;
    private List<MistakeDetailDTO> mistakes;
    private List<String> recommendations;
    private int unrecognizedEventCount;

    public ScoreReportDTO() {}

    public ScoreReportDTO(String sessionId, String traineeId, String traineeName, String batchUnit, String scenarioCode, String scenarioTitle, Instant startedAt, Instant completedAt, long totalDurationSeconds, int finalScore, String passStatus, boolean passed, ScoreBreakdownDTO breakdown, List<MistakeDetailDTO> mistakes, List<String> recommendations, int unrecognizedEventCount) {
        this.sessionId = sessionId;
        this.traineeId = traineeId;
        this.traineeName = traineeName;
        this.batchUnit = batchUnit;
        this.scenarioCode = scenarioCode;
        this.scenarioTitle = scenarioTitle;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.totalDurationSeconds = totalDurationSeconds;
        this.finalScore = finalScore;
        this.passStatus = passStatus;
        this.passed = passed;
        this.breakdown = breakdown;
        this.mistakes = mistakes;
        this.recommendations = recommendations;
        this.unrecognizedEventCount = unrecognizedEventCount;
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

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public long getTotalDurationSeconds() { return totalDurationSeconds; }
    public void setTotalDurationSeconds(long totalDurationSeconds) { this.totalDurationSeconds = totalDurationSeconds; }

    public int getFinalScore() { return finalScore; }
    public void setFinalScore(int finalScore) { this.finalScore = finalScore; }

    public String getPassStatus() { return passStatus; }
    public void setPassStatus(String passStatus) { this.passStatus = passStatus; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public ScoreBreakdownDTO getBreakdown() { return breakdown; }
    public void setBreakdown(ScoreBreakdownDTO breakdown) { this.breakdown = breakdown; }

    public List<MistakeDetailDTO> getMistakes() { return mistakes; }
    public void setMistakes(List<MistakeDetailDTO> mistakes) { this.mistakes = mistakes; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public int getUnrecognizedEventCount() { return unrecognizedEventCount; }
    public void setUnrecognizedEventCount(int unrecognizedEventCount) { this.unrecognizedEventCount = unrecognizedEventCount; }

    public static ScoreReportDTOBuilder builder() { return new ScoreReportDTOBuilder(); }

    public static class ScoreReportDTOBuilder {
        private String sessionId;
        private String traineeId;
        private String traineeName;
        private String batchUnit;
        private String scenarioCode;
        private String scenarioTitle;
        private Instant startedAt;
        private Instant completedAt;
        private long totalDurationSeconds;
        private int finalScore;
        private String passStatus;
        private boolean passed;
        private ScoreBreakdownDTO breakdown;
        private List<MistakeDetailDTO> mistakes;
        private List<String> recommendations;
        private int unrecognizedEventCount;

        public ScoreReportDTOBuilder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
        public ScoreReportDTOBuilder traineeId(String traineeId) { this.traineeId = traineeId; return this; }
        public ScoreReportDTOBuilder traineeName(String traineeName) { this.traineeName = traineeName; return this; }
        public ScoreReportDTOBuilder batchUnit(String batchUnit) { this.batchUnit = batchUnit; return this; }
        public ScoreReportDTOBuilder scenarioCode(String scenarioCode) { this.scenarioCode = scenarioCode; return this; }
        public ScoreReportDTOBuilder scenarioTitle(String scenarioTitle) { this.scenarioTitle = scenarioTitle; return this; }
        public ScoreReportDTOBuilder startedAt(Instant startedAt) { this.startedAt = startedAt; return this; }
        public ScoreReportDTOBuilder completedAt(Instant completedAt) { this.completedAt = completedAt; return this; }
        public ScoreReportDTOBuilder totalDurationSeconds(long totalDurationSeconds) { this.totalDurationSeconds = totalDurationSeconds; return this; }
        public ScoreReportDTOBuilder finalScore(int finalScore) { this.finalScore = finalScore; return this; }
        public ScoreReportDTOBuilder passStatus(String passStatus) { this.passStatus = passStatus; return this; }
        public ScoreReportDTOBuilder passed(boolean passed) { this.passed = passed; return this; }
        public ScoreReportDTOBuilder breakdown(ScoreBreakdownDTO breakdown) { this.breakdown = breakdown; return this; }
        public ScoreReportDTOBuilder mistakes(List<MistakeDetailDTO> mistakes) { this.mistakes = mistakes; return this; }
        public ScoreReportDTOBuilder recommendations(List<String> recommendations) { this.recommendations = recommendations; return this; }
        public ScoreReportDTOBuilder unrecognizedEventCount(int unrecognizedEventCount) { this.unrecognizedEventCount = unrecognizedEventCount; return this; }

        public ScoreReportDTO build() {
            return new ScoreReportDTO(sessionId, traineeId, traineeName, batchUnit, scenarioCode, scenarioTitle, startedAt, completedAt, totalDurationSeconds, finalScore, passStatus, passed, breakdown, mistakes, recommendations, unrecognizedEventCount);
        }
    }
}

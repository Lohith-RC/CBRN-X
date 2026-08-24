package com.cbrsx.backend.dto;

import java.time.Instant;

public class SessionSummaryDTO {
    private String sessionId;
    private String traineeId;
    private String traineeName;
    private String batchUnit;
    private String scenarioTitle;
    private Instant startedAt;
    private Instant completedAt;
    private Integer finalScore;
    private String passStatus;

    public SessionSummaryDTO() {}

    public SessionSummaryDTO(String sessionId, String traineeId, String traineeName, String batchUnit,
                             String scenarioTitle, Instant startedAt, Instant completedAt,
                             Integer finalScore, String passStatus) {
        this.sessionId = sessionId;
        this.traineeId = traineeId;
        this.traineeName = traineeName;
        this.batchUnit = batchUnit;
        this.scenarioTitle = scenarioTitle;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.finalScore = finalScore;
        this.passStatus = passStatus;
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getTraineeId() { return traineeId; }
    public void setTraineeId(String traineeId) { this.traineeId = traineeId; }

    public String getTraineeName() { return traineeName; }
    public void setTraineeName(String traineeName) { this.traineeName = traineeName; }

    public String getBatchUnit() { return batchUnit; }
    public void setBatchUnit(String batchUnit) { this.batchUnit = batchUnit; }

    public String getScenarioTitle() { return scenarioTitle; }
    public void setScenarioTitle(String scenarioTitle) { this.scenarioTitle = scenarioTitle; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Integer getFinalScore() { return finalScore; }
    public void setFinalScore(Integer finalScore) { this.finalScore = finalScore; }

    public String getPassStatus() { return passStatus; }
    public void setPassStatus(String passStatus) { this.passStatus = passStatus; }

    public static SessionSummaryDTOBuilder builder() { return new SessionSummaryDTOBuilder(); }

    public static class SessionSummaryDTOBuilder {
        private String sessionId;
        private String traineeId;
        private String traineeName;
        private String batchUnit;
        private String scenarioTitle;
        private Instant startedAt;
        private Instant completedAt;
        private Integer finalScore;
        private String passStatus;

        public SessionSummaryDTOBuilder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
        public SessionSummaryDTOBuilder traineeId(String traineeId) { this.traineeId = traineeId; return this; }
        public SessionSummaryDTOBuilder traineeName(String traineeName) { this.traineeName = traineeName; return this; }
        public SessionSummaryDTOBuilder batchUnit(String batchUnit) { this.batchUnit = batchUnit; return this; }
        public SessionSummaryDTOBuilder scenarioTitle(String scenarioTitle) { this.scenarioTitle = scenarioTitle; return this; }
        public SessionSummaryDTOBuilder startedAt(Instant startedAt) { this.startedAt = startedAt; return this; }
        public SessionSummaryDTOBuilder completedAt(Instant completedAt) { this.completedAt = completedAt; return this; }
        public SessionSummaryDTOBuilder finalScore(Integer finalScore) { this.finalScore = finalScore; return this; }
        public SessionSummaryDTOBuilder passStatus(String passStatus) { this.passStatus = passStatus; return this; }

        public SessionSummaryDTO build() {
            return new SessionSummaryDTO(sessionId, traineeId, traineeName, batchUnit, scenarioTitle,
                    startedAt, completedAt, finalScore, passStatus);
        }
    }
}

package com.cbrsx.backend.dto;

import java.time.Instant;

public class StartSessionResponse {
    private String sessionId;
    private String traineeId;
    private String scenarioId;
    private String scenarioTitle;
    private Instant startedAt;

    public StartSessionResponse() {}

    public StartSessionResponse(String sessionId, String traineeId, String scenarioId, String scenarioTitle, Instant startedAt) {
        this.sessionId = sessionId;
        this.traineeId = traineeId;
        this.scenarioId = scenarioId;
        this.scenarioTitle = scenarioTitle;
        this.startedAt = startedAt;
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getTraineeId() { return traineeId; }
    public void setTraineeId(String traineeId) { this.traineeId = traineeId; }

    public String getScenarioId() { return scenarioId; }
    public void setScenarioId(String scenarioId) { this.scenarioId = scenarioId; }

    public String getScenarioTitle() { return scenarioTitle; }
    public void setScenarioTitle(String scenarioTitle) { this.scenarioTitle = scenarioTitle; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public static StartSessionResponseBuilder builder() { return new StartSessionResponseBuilder(); }

    public static class StartSessionResponseBuilder {
        private String sessionId;
        private String traineeId;
        private String scenarioId;
        private String scenarioTitle;
        private Instant startedAt;

        public StartSessionResponseBuilder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
        public StartSessionResponseBuilder traineeId(String traineeId) { this.traineeId = traineeId; return this; }
        public StartSessionResponseBuilder scenarioId(String scenarioId) { this.scenarioId = scenarioId; return this; }
        public StartSessionResponseBuilder scenarioTitle(String scenarioTitle) { this.scenarioTitle = scenarioTitle; return this; }
        public StartSessionResponseBuilder startedAt(Instant startedAt) { this.startedAt = startedAt; return this; }

        public StartSessionResponse build() {
            return new StartSessionResponse(sessionId, traineeId, scenarioId, scenarioTitle, startedAt);
        }
    }
}

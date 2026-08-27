package com.cbrsx.backend.dto;

import java.time.Instant;

/**
 * Represents a single chronological simulation attempt by a trainee,
 * formatted for frontend charting (Recharts) and progression analytics.
 */
public class AttemptProgressDTO {
    private int attemptNumber;
    private String sessionId;
    private String scenarioCode;
    private String scenarioTitle;
    private Instant startedAt;
    private Instant completedAt;
    private long durationSeconds;
    private int finalScore;
    private String passStatus;
    private boolean passed;

    // Component dimensional scores
    private int ppeScore;
    private int detectionScore;
    private int evacuationScore;
    private int containmentScore;
    private int decontaminationScore;
    private int timeBonusScore;
    private int totalPenalties;

    public AttemptProgressDTO() {}

    public AttemptProgressDTO(int attemptNumber, String sessionId, String scenarioCode, String scenarioTitle,
                              Instant startedAt, Instant completedAt, long durationSeconds, int finalScore,
                              String passStatus, boolean passed, int ppeScore, int detectionScore,
                              int evacuationScore, int containmentScore, int decontaminationScore,
                              int timeBonusScore, int totalPenalties) {
        this.attemptNumber = attemptNumber;
        this.sessionId = sessionId;
        this.scenarioCode = scenarioCode;
        this.scenarioTitle = scenarioTitle;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.durationSeconds = durationSeconds;
        this.finalScore = finalScore;
        this.passStatus = passStatus;
        this.passed = passed;
        this.ppeScore = ppeScore;
        this.detectionScore = detectionScore;
        this.evacuationScore = evacuationScore;
        this.containmentScore = containmentScore;
        this.decontaminationScore = decontaminationScore;
        this.timeBonusScore = timeBonusScore;
        this.totalPenalties = totalPenalties;
    }

    public static Builder builder() {
        return new Builder();
    }

    public int getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(int attemptNumber) { this.attemptNumber = attemptNumber; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getScenarioCode() { return scenarioCode; }
    public void setScenarioCode(String scenarioCode) { this.scenarioCode = scenarioCode; }

    public String getScenarioTitle() { return scenarioTitle; }
    public void setScenarioTitle(String scenarioTitle) { this.scenarioTitle = scenarioTitle; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public long getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(long durationSeconds) { this.durationSeconds = durationSeconds; }

    public int getFinalScore() { return finalScore; }
    public void setFinalScore(int finalScore) { this.finalScore = finalScore; }

    public String getPassStatus() { return passStatus; }
    public void setPassStatus(String passStatus) { this.passStatus = passStatus; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public int getPpeScore() { return ppeScore; }
    public void setPpeScore(int ppeScore) { this.ppeScore = ppeScore; }

    public int getDetectionScore() { return detectionScore; }
    public void setDetectionScore(int detectionScore) { this.detectionScore = detectionScore; }

    public int getEvacuationScore() { return evacuationScore; }
    public void setEvacuationScore(int evacuationScore) { this.evacuationScore = evacuationScore; }

    public int getContainmentScore() { return containmentScore; }
    public void setContainmentScore(int containmentScore) { this.containmentScore = containmentScore; }

    public int getDecontaminationScore() { return decontaminationScore; }
    public void setDecontaminationScore(int decontaminationScore) { this.decontaminationScore = decontaminationScore; }

    public int getTimeBonusScore() { return timeBonusScore; }
    public void setTimeBonusScore(int timeBonusScore) { this.timeBonusScore = timeBonusScore; }

    public int getTotalPenalties() { return totalPenalties; }
    public void setTotalPenalties(int totalPenalties) { this.totalPenalties = totalPenalties; }

    public static class Builder {
        private int attemptNumber;
        private String sessionId;
        private String scenarioCode;
        private String scenarioTitle;
        private Instant startedAt;
        private Instant completedAt;
        private long durationSeconds;
        private int finalScore;
        private String passStatus;
        private boolean passed;
        private int ppeScore;
        private int detectionScore;
        private int evacuationScore;
        private int containmentScore;
        private int decontaminationScore;
        private int timeBonusScore;
        private int totalPenalties;

        public Builder attemptNumber(int attemptNumber) { this.attemptNumber = attemptNumber; return this; }
        public Builder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
        public Builder scenarioCode(String scenarioCode) { this.scenarioCode = scenarioCode; return this; }
        public Builder scenarioTitle(String scenarioTitle) { this.scenarioTitle = scenarioTitle; return this; }
        public Builder startedAt(Instant startedAt) { this.startedAt = startedAt; return this; }
        public Builder completedAt(Instant completedAt) { this.completedAt = completedAt; return this; }
        public Builder durationSeconds(long durationSeconds) { this.durationSeconds = durationSeconds; return this; }
        public Builder finalScore(int finalScore) { this.finalScore = finalScore; return this; }
        public Builder passStatus(String passStatus) { this.passStatus = passStatus; return this; }
        public Builder passed(boolean passed) { this.passed = passed; return this; }
        public Builder ppeScore(int ppeScore) { this.ppeScore = ppeScore; return this; }
        public Builder detectionScore(int detectionScore) { this.detectionScore = detectionScore; return this; }
        public Builder evacuationScore(int evacuationScore) { this.evacuationScore = evacuationScore; return this; }
        public Builder containmentScore(int containmentScore) { this.containmentScore = containmentScore; return this; }
        public Builder decontaminationScore(int decontaminationScore) { this.decontaminationScore = decontaminationScore; return this; }
        public Builder timeBonusScore(int timeBonusScore) { this.timeBonusScore = timeBonusScore; return this; }
        public Builder totalPenalties(int totalPenalties) { this.totalPenalties = totalPenalties; return this; }

        public AttemptProgressDTO build() {
            return new AttemptProgressDTO(attemptNumber, sessionId, scenarioCode, scenarioTitle, startedAt,
                    completedAt, durationSeconds, finalScore, passStatus, passed, ppeScore, detectionScore,
                    evacuationScore, containmentScore, decontaminationScore, timeBonusScore, totalPenalties);
        }
    }
}

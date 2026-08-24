package com.cbrsx.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sessions")
public class TrainingSession {

    @Id
    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "trainee_id", length = 64, nullable = false)
    private String traineeId;

    @Column(name = "scenario_id", length = 64, nullable = false)
    private String scenarioId;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "final_score")
    private Integer finalScore;

    @Column(name = "pass_status", length = 20)
    private String passStatus = "PENDING";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public TrainingSession() {}

    public TrainingSession(String sessionId, String traineeId, String scenarioId, Instant startedAt, Instant completedAt, Integer finalScore, String passStatus, Instant createdAt) {
        this.sessionId = sessionId;
        this.traineeId = traineeId;
        this.scenarioId = scenarioId;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.finalScore = finalScore;
        this.passStatus = passStatus != null ? passStatus : "PENDING";
        this.createdAt = createdAt;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) { createdAt = Instant.now(); }
        if (startedAt == null) { startedAt = Instant.now(); }
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getTraineeId() { return traineeId; }
    public void setTraineeId(String traineeId) { this.traineeId = traineeId; }

    public String getScenarioId() { return scenarioId; }
    public void setScenarioId(String scenarioId) { this.scenarioId = scenarioId; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Integer getFinalScore() { return finalScore; }
    public void setFinalScore(Integer finalScore) { this.finalScore = finalScore; }

    public String getPassStatus() { return passStatus; }
    public void setPassStatus(String passStatus) { this.passStatus = passStatus; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static TrainingSessionBuilder builder() { return new TrainingSessionBuilder(); }

    public static class TrainingSessionBuilder {
        private String sessionId;
        private String traineeId;
        private String scenarioId;
        private Instant startedAt;
        private Instant completedAt;
        private Integer finalScore;
        private String passStatus = "PENDING";
        private Instant createdAt;

        public TrainingSessionBuilder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
        public TrainingSessionBuilder traineeId(String traineeId) { this.traineeId = traineeId; return this; }
        public TrainingSessionBuilder scenarioId(String scenarioId) { this.scenarioId = scenarioId; return this; }
        public TrainingSessionBuilder startedAt(Instant startedAt) { this.startedAt = startedAt; return this; }
        public TrainingSessionBuilder completedAt(Instant completedAt) { this.completedAt = completedAt; return this; }
        public TrainingSessionBuilder finalScore(Integer finalScore) { this.finalScore = finalScore; return this; }
        public TrainingSessionBuilder passStatus(String passStatus) { this.passStatus = passStatus; return this; }
        public TrainingSessionBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public TrainingSession build() {
            return new TrainingSession(sessionId, traineeId, scenarioId, startedAt, completedAt, finalScore, passStatus, createdAt);
        }
    }
}

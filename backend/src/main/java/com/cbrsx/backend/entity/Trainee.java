package com.cbrsx.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "trainees")
public class Trainee {

    @Id
    @Column(name = "trainee_id", length = 64)
    private String traineeId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "batch_unit", nullable = false)
    private String batchUnit;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Trainee() {}

    public Trainee(String traineeId, String name, String batchUnit, Instant createdAt) {
        this.traineeId = traineeId;
        this.name = name;
        this.batchUnit = batchUnit;
        this.createdAt = createdAt;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public String getTraineeId() { return traineeId; }
    public void setTraineeId(String traineeId) { this.traineeId = traineeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBatchUnit() { return batchUnit; }
    public void setBatchUnit(String batchUnit) { this.batchUnit = batchUnit; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static TraineeBuilder builder() { return new TraineeBuilder(); }

    public static class TraineeBuilder {
        private String traineeId;
        private String name;
        private String batchUnit;
        private Instant createdAt;

        public TraineeBuilder traineeId(String traineeId) { this.traineeId = traineeId; return this; }
        public TraineeBuilder name(String name) { this.name = name; return this; }
        public TraineeBuilder batchUnit(String batchUnit) { this.batchUnit = batchUnit; return this; }
        public TraineeBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public Trainee build() {
            return new Trainee(traineeId, name, batchUnit, createdAt);
        }
    }
}

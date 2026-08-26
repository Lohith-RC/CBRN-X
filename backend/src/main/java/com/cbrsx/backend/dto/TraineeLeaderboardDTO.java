package com.cbrsx.backend.dto;

import java.time.Instant;

public class TraineeLeaderboardDTO {

    private String traineeId;
    private String name;
    private String batchUnit;
    private int totalDrills;
    private int passedDrills;
    private double passRate;
    private double averageScore;
    private int bestScore;
    private boolean certified;
    private Instant lastActive;

    public TraineeLeaderboardDTO() {}

    public TraineeLeaderboardDTO(String traineeId, String name, String batchUnit, int totalDrills, int passedDrills, double passRate, double averageScore, int bestScore, boolean certified, Instant lastActive) {
        this.traineeId = traineeId;
        this.name = name;
        this.batchUnit = batchUnit;
        this.totalDrills = totalDrills;
        this.passedDrills = passedDrills;
        this.passRate = passRate;
        this.averageScore = averageScore;
        this.bestScore = bestScore;
        this.certified = certified;
        this.lastActive = lastActive;
    }

    public String getTraineeId() { return traineeId; }
    public void setTraineeId(String traineeId) { this.traineeId = traineeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBatchUnit() { return batchUnit; }
    public void setBatchUnit(String batchUnit) { this.batchUnit = batchUnit; }

    public int getTotalDrills() { return totalDrills; }
    public void setTotalDrills(int totalDrills) { this.totalDrills = totalDrills; }

    public int getPassedDrills() { return passedDrills; }
    public void setPassedDrills(int passedDrills) { this.passedDrills = passedDrills; }

    public double getPassRate() { return passRate; }
    public void setPassRate(double passRate) { this.passRate = passRate; }

    public double getAverageScore() { return averageScore; }
    public void setAverageScore(double averageScore) { this.averageScore = averageScore; }

    public int getBestScore() { return bestScore; }
    public void setBestScore(int bestScore) { this.bestScore = bestScore; }

    public boolean isCertified() { return certified; }
    public void setCertified(boolean certified) { this.certified = certified; }

    public Instant getLastActive() { return lastActive; }
    public void setLastActive(Instant lastActive) { this.lastActive = lastActive; }
}

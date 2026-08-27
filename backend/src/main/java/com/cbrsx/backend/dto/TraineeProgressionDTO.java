package com.cbrsx.backend.dto;

import java.util.List;
import java.util.Map;

/**
 * Aggregated longitudinal skill-growth tracking payload for a trainee.
 * Exposes statistical performance trends across attempts 1 through N.
 */
public class TraineeProgressionDTO {
    private String traineeId;
    private String traineeName;
    private String batchUnit;

    // Aggregate statistics
    private int totalAttempts;
    private int completedAttempts;
    private int passedAttempts;
    private double passRatePercentage;

    private int initialScore;
    private int latestScore;
    private int highestScore;
    private double averageScore;
    private double growthPercentage; // ((latest - initial) / initial) * 100

    // Component average breakdown across all attempts
    private Map<String, Double> dimensionAverages;

    // Chronological attempt list for Recharts
    private List<AttemptProgressDTO> attemptHistory;

    public TraineeProgressionDTO() {}

    public TraineeProgressionDTO(String traineeId, String traineeName, String batchUnit, int totalAttempts,
                                 int completedAttempts, int passedAttempts, double passRatePercentage,
                                 int initialScore, int latestScore, int highestScore, double averageScore,
                                 double growthPercentage, Map<String, Double> dimensionAverages,
                                 List<AttemptProgressDTO> attemptHistory) {
        this.traineeId = traineeId;
        this.traineeName = traineeName;
        this.batchUnit = batchUnit;
        this.totalAttempts = totalAttempts;
        this.completedAttempts = completedAttempts;
        this.passedAttempts = passedAttempts;
        this.passRatePercentage = passRatePercentage;
        this.initialScore = initialScore;
        this.latestScore = latestScore;
        this.highestScore = highestScore;
        this.averageScore = averageScore;
        this.growthPercentage = growthPercentage;
        this.dimensionAverages = dimensionAverages;
        this.attemptHistory = attemptHistory;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getTraineeId() { return traineeId; }
    public void setTraineeId(String traineeId) { this.traineeId = traineeId; }

    public String getTraineeName() { return traineeName; }
    public void setTraineeName(String traineeName) { this.traineeName = traineeName; }

    public String getBatchUnit() { return batchUnit; }
    public void setBatchUnit(String batchUnit) { this.batchUnit = batchUnit; }

    public int getTotalAttempts() { return totalAttempts; }
    public void setTotalAttempts(int totalAttempts) { this.totalAttempts = totalAttempts; }

    public int getCompletedAttempts() { return completedAttempts; }
    public void setCompletedAttempts(int completedAttempts) { this.completedAttempts = completedAttempts; }

    public int getPassedAttempts() { return passedAttempts; }
    public void setPassedAttempts(int passedAttempts) { this.passedAttempts = passedAttempts; }

    public double getPassRatePercentage() { return passRatePercentage; }
    public void setPassRatePercentage(double passRatePercentage) { this.passRatePercentage = passRatePercentage; }

    public int getInitialScore() { return initialScore; }
    public void setInitialScore(int initialScore) { this.initialScore = initialScore; }

    public int getLatestScore() { return latestScore; }
    public void setLatestScore(int latestScore) { this.latestScore = latestScore; }

    public int getHighestScore() { return highestScore; }
    public void setHighestScore(int highestScore) { this.highestScore = highestScore; }

    public double getAverageScore() { return averageScore; }
    public void setAverageScore(double averageScore) { this.averageScore = averageScore; }

    public double getGrowthPercentage() { return growthPercentage; }
    public void setGrowthPercentage(double growthPercentage) { this.growthPercentage = growthPercentage; }

    public Map<String, Double> getDimensionAverages() { return dimensionAverages; }
    public void setDimensionAverages(Map<String, Double> dimensionAverages) { this.dimensionAverages = dimensionAverages; }

    public List<AttemptProgressDTO> getAttemptHistory() { return attemptHistory; }
    public void setAttemptHistory(List<AttemptProgressDTO> attemptHistory) { this.attemptHistory = attemptHistory; }

    public static class Builder {
        private String traineeId;
        private String traineeName;
        private String batchUnit;
        private int totalAttempts;
        private int completedAttempts;
        private int passedAttempts;
        private double passRatePercentage;
        private int initialScore;
        private int latestScore;
        private int highestScore;
        private double averageScore;
        private double growthPercentage;
        private Map<String, Double> dimensionAverages;
        private List<AttemptProgressDTO> attemptHistory;

        public Builder traineeId(String traineeId) { this.traineeId = traineeId; return this; }
        public Builder traineeName(String traineeName) { this.traineeName = traineeName; return this; }
        public Builder batchUnit(String batchUnit) { this.batchUnit = batchUnit; return this; }
        public Builder totalAttempts(int totalAttempts) { this.totalAttempts = totalAttempts; return this; }
        public Builder completedAttempts(int completedAttempts) { this.completedAttempts = completedAttempts; return this; }
        public Builder passedAttempts(int passedAttempts) { this.passedAttempts = passedAttempts; return this; }
        public Builder passRatePercentage(double passRatePercentage) { this.passRatePercentage = passRatePercentage; return this; }
        public Builder initialScore(int initialScore) { this.initialScore = initialScore; return this; }
        public Builder latestScore(int latestScore) { this.latestScore = latestScore; return this; }
        public Builder highestScore(int highestScore) { this.highestScore = highestScore; return this; }
        public Builder averageScore(double averageScore) { this.averageScore = averageScore; return this; }
        public Builder growthPercentage(double growthPercentage) { this.growthPercentage = growthPercentage; return this; }
        public Builder dimensionAverages(Map<String, Double> dimensionAverages) { this.dimensionAverages = dimensionAverages; return this; }
        public Builder attemptHistory(List<AttemptProgressDTO> attemptHistory) { this.attemptHistory = attemptHistory; return this; }

        public TraineeProgressionDTO build() {
            return new TraineeProgressionDTO(traineeId, traineeName, batchUnit, totalAttempts, completedAttempts,
                    passedAttempts, passRatePercentage, initialScore, latestScore, highestScore, averageScore,
                    growthPercentage, dimensionAverages, attemptHistory);
        }
    }
}

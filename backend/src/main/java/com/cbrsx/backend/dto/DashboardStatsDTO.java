package com.cbrsx.backend.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsDTO {
    private long totalTrainees;
    private long totalSessionsCompleted;
    private double overallPassRate;
    private double averageScore;

    private Map<String, Long> passStatusCounts;
    private Map<String, Long> topMistakesFrequency;

    private List<ScoreReportDTO> recentSessions;

    public DashboardStatsDTO() {}

    public DashboardStatsDTO(long totalTrainees, long totalSessionsCompleted, double overallPassRate, double averageScore, Map<String, Long> passStatusCounts, Map<String, Long> topMistakesFrequency, List<ScoreReportDTO> recentSessions) {
        this.totalTrainees = totalTrainees;
        this.totalSessionsCompleted = totalSessionsCompleted;
        this.overallPassRate = overallPassRate;
        this.averageScore = averageScore;
        this.passStatusCounts = passStatusCounts;
        this.topMistakesFrequency = topMistakesFrequency;
        this.recentSessions = recentSessions;
    }

    public long getTotalTrainees() { return totalTrainees; }
    public void setTotalTrainees(long totalTrainees) { this.totalTrainees = totalTrainees; }

    public long getTotalSessionsCompleted() { return totalSessionsCompleted; }
    public void setTotalSessionsCompleted(long totalSessionsCompleted) { this.totalSessionsCompleted = totalSessionsCompleted; }

    public double getOverallPassRate() { return overallPassRate; }
    public void setOverallPassRate(double overallPassRate) { this.overallPassRate = overallPassRate; }

    public double getAverageScore() { return averageScore; }
    public void setAverageScore(double averageScore) { this.averageScore = averageScore; }

    public Map<String, Long> getPassStatusCounts() { return passStatusCounts; }
    public void setPassStatusCounts(Map<String, Long> passStatusCounts) { this.passStatusCounts = passStatusCounts; }

    public Map<String, Long> getTopMistakesFrequency() { return topMistakesFrequency; }
    public void setTopMistakesFrequency(Map<String, Long> topMistakesFrequency) { this.topMistakesFrequency = topMistakesFrequency; }

    public List<ScoreReportDTO> getRecentSessions() { return recentSessions; }
    public void setRecentSessions(List<ScoreReportDTO> recentSessions) { this.recentSessions = recentSessions; }

    public static DashboardStatsDTOBuilder builder() { return new DashboardStatsDTOBuilder(); }

    public static class DashboardStatsDTOBuilder {
        private long totalTrainees;
        private long totalSessionsCompleted;
        private double overallPassRate;
        private double averageScore;
        private Map<String, Long> passStatusCounts;
        private Map<String, Long> topMistakesFrequency;
        private List<ScoreReportDTO> recentSessions;

        public DashboardStatsDTOBuilder totalTrainees(long totalTrainees) { this.totalTrainees = totalTrainees; return this; }
        public DashboardStatsDTOBuilder totalSessionsCompleted(long totalSessionsCompleted) { this.totalSessionsCompleted = totalSessionsCompleted; return this; }
        public DashboardStatsDTOBuilder overallPassRate(double overallPassRate) { this.overallPassRate = overallPassRate; return this; }
        public DashboardStatsDTOBuilder averageScore(double averageScore) { this.averageScore = averageScore; return this; }
        public DashboardStatsDTOBuilder passStatusCounts(Map<String, Long> passStatusCounts) { this.passStatusCounts = passStatusCounts; return this; }
        public DashboardStatsDTOBuilder topMistakesFrequency(Map<String, Long> topMistakesFrequency) { this.topMistakesFrequency = topMistakesFrequency; return this; }
        public DashboardStatsDTOBuilder recentSessions(List<ScoreReportDTO> recentSessions) { this.recentSessions = recentSessions; return this; }

        public DashboardStatsDTO build() {
            return new DashboardStatsDTO(totalTrainees, totalSessionsCompleted, overallPassRate, averageScore, passStatusCounts, topMistakesFrequency, recentSessions);
        }
    }
}

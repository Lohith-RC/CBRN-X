package com.cbrsx.backend.dto;

import java.util.List;
import java.util.Map;

public class SquadSummaryDTO {

    private String squadId;
    private int activeMembers;
    private int totalSessions;
    private int passedSessions;
    private double passRate;
    private double averageScore;
    private int totalPenalties;
    private double teamComplianceRate;
    private Map<String, Integer> roleDistribution;
    private List<String> memberNames;

    public SquadSummaryDTO() {}

    public SquadSummaryDTO(String squadId, int activeMembers, int totalSessions, int passedSessions, double passRate, double averageScore, int totalPenalties, double teamComplianceRate, Map<String, Integer> roleDistribution, List<String> memberNames) {
        this.squadId = squadId;
        this.activeMembers = activeMembers;
        this.totalSessions = totalSessions;
        this.passedSessions = passedSessions;
        this.passRate = passRate;
        this.averageScore = averageScore;
        this.totalPenalties = totalPenalties;
        this.teamComplianceRate = teamComplianceRate;
        this.roleDistribution = roleDistribution;
        this.memberNames = memberNames;
    }

    public String getSquadId() { return squadId; }
    public void setSquadId(String squadId) { this.squadId = squadId; }

    public int getActiveMembers() { return activeMembers; }
    public void setActiveMembers(int activeMembers) { this.activeMembers = activeMembers; }

    public int getTotalSessions() { return totalSessions; }
    public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }

    public int getPassedSessions() { return passedSessions; }
    public void setPassedSessions(int passedSessions) { this.passedSessions = passedSessions; }

    public double getPassRate() { return passRate; }
    public void setPassRate(double passRate) { this.passRate = passRate; }

    public double getAverageScore() { return averageScore; }
    public void setAverageScore(double averageScore) { this.averageScore = averageScore; }

    public int getTotalPenalties() { return totalPenalties; }
    public void setTotalPenalties(int totalPenalties) { this.totalPenalties = totalPenalties; }

    public double getTeamComplianceRate() { return teamComplianceRate; }
    public void setTeamComplianceRate(double teamComplianceRate) { this.teamComplianceRate = teamComplianceRate; }

    public Map<String, Integer> getRoleDistribution() { return roleDistribution; }
    public void setRoleDistribution(Map<String, Integer> roleDistribution) { this.roleDistribution = roleDistribution; }

    public List<String> getMemberNames() { return memberNames; }
    public void setMemberNames(List<String> memberNames) { this.memberNames = memberNames; }
}

package com.cbrsx.backend.dto;

import java.util.List;

public class SquadComparisonDTO {

    private String topPerformingSquad;
    private double overallSquadAverage;
    private List<SquadSummaryDTO> squads;

    public SquadComparisonDTO() {}

    public SquadComparisonDTO(String topPerformingSquad, double overallSquadAverage, List<SquadSummaryDTO> squads) {
        this.topPerformingSquad = topPerformingSquad;
        this.overallSquadAverage = overallSquadAverage;
        this.squads = squads;
    }

    public String getTopPerformingSquad() { return topPerformingSquad; }
    public void setTopPerformingSquad(String topPerformingSquad) { this.topPerformingSquad = topPerformingSquad; }

    public double getOverallSquadAverage() { return overallSquadAverage; }
    public void setOverallSquadAverage(double overallSquadAverage) { this.overallSquadAverage = overallSquadAverage; }

    public List<SquadSummaryDTO> getSquads() { return squads; }
    public void setSquads(List<SquadSummaryDTO> squads) { this.squads = squads; }
}

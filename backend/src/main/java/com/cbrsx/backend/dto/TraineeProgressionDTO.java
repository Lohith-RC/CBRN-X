package com.cbrsx.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Aggregated longitudinal skill-growth tracking payload for a trainee.
 * Exposes statistical performance trends across attempts 1 through N.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}

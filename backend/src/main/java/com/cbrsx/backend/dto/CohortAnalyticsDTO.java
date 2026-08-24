package com.cbrsx.backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Aggregated cohort analytics for instructor debrief boards.
 * All figures derive exclusively from completed, non-voided sessions.
 */
public record CohortAnalyticsDTO(
        List<ScenarioStat> scenarioBreakdown,
        List<Weakness> weaknessBoard,
        List<AtRiskTrainee> atRiskTrainees,
        List<TrendPoint> trend,
        Instant generatedAt) {

    public record ScenarioStat(
            String scenarioId,
            String code,
            String title,
            long attempts,
            Double avgScore,
            double passRatePct) {}

    /** A recurring negative signal across the cohort, ranked by frequency. */
    public record Weakness(String key, String label, String severity, long occurrences) {}

    public record AtRiskTrainee(
            String traineeId,
            String name,
            String batchUnit,
            long attempts,
            Double avgScore,
            long failedAttempts) {}

    /** Daily cohort average; avgScore is null on days with no completions. */
    public record TrendPoint(LocalDate date, long attempts, Double avgScore) {}
}

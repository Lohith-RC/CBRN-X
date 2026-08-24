package com.cbrsx.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Represents a single chronological simulation attempt by a trainee,
 * formatted for frontend charting (Recharts) and progression analytics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}

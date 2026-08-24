package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.AttemptProgressDTO;
import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.dto.TraineeProgressionDTO;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Longitudinal Trainee Skill-Growth Analytics Engine.
 * Provides a read-only query layer aggregating performance trends,
 * percentage skill-growth calculations, and attempt progression histories.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TraineeAnalyticsService {

    private final TraineeRepository traineeRepository;
    private final SessionRepository sessionRepository;
    private final ScoringService scoringService;

    /**
     * Calculates the longitudinal progression and growth trends for a trainee across all attempts.
     *
     * @param traineeId The unique trainee identifier
     * @return TraineeProgressionDTO containing historical attempt metrics and growth rates
     */
    @Transactional(readOnly = true)
    public TraineeProgressionDTO getTraineeProgression(String traineeId) {
        Trainee trainee = traineeRepository.findById(traineeId)
                .orElseThrow(() -> new IllegalArgumentException("Trainee not found with ID: " + traineeId));

        List<TrainingSession> sessions = sessionRepository.findByTraineeIdOrderByStartedAtAsc(traineeId);

        if (sessions.isEmpty()) {
            return TraineeProgressionDTO.builder()
                    .traineeId(trainee.getTraineeId())
                    .traineeName(trainee.getName())
                    .batchUnit(trainee.getBatchUnit())
                    .totalAttempts(0)
                    .completedAttempts(0)
                    .passedAttempts(0)
                    .passRatePercentage(0.0)
                    .initialScore(0)
                    .latestScore(0)
                    .highestScore(0)
                    .averageScore(0.0)
                    .growthPercentage(0.0)
                    .dimensionAverages(Collections.emptyMap())
                    .attemptHistory(Collections.emptyList())
                    .build();
        }

        List<AttemptProgressDTO> attempts = new ArrayList<>();
        int attemptCounter = 1;

        double sumPpe = 0;
        double sumDetection = 0;
        double sumEvacuation = 0;
        double sumContainment = 0;
        double sumDecontamination = 0;
        double sumTimeBonus = 0;
        int completedCount = 0;
        int passedCount = 0;
        int maxScore = 0;
        double sumScore = 0;

        for (TrainingSession session : sessions) {
            ScoreReportDTO report = null;
            try {
                report = scoringService.previewScore(session.getSessionId());
            } catch (Exception e) {
                log.debug("Could not calculate full breakdown for session {}: {}", session.getSessionId(), e.getMessage());
            }

            int score = (report != null) ? report.getFinalScore()
                    : (session.getFinalScore() != null ? session.getFinalScore() : 0);
            boolean passed = (report != null) ? report.isPassed()
                    : (score >= ScoringService.PASS_THRESHOLD);
            String passStatus = (session.getPassStatus() != null && !"IN_PROGRESS".equals(session.getPassStatus()))
                    ? session.getPassStatus()
                    : (passed ? "PASSED" : "FAILED");

            int ppe = (report != null && report.getBreakdown() != null) ? report.getBreakdown().getPpeScore() : 0;
            int det = (report != null && report.getBreakdown() != null) ? report.getBreakdown().getDetectionScore() : 0;
            int evac = (report != null && report.getBreakdown() != null) ? report.getBreakdown().getEvacuationScore() : 0;
            int cont = (report != null && report.getBreakdown() != null) ? report.getBreakdown().getContainmentScore() : 0;
            int decon = (report != null && report.getBreakdown() != null) ? report.getBreakdown().getDecontaminationScore() : 0;
            int timeBonus = (report != null && report.getBreakdown() != null) ? report.getBreakdown().getTimeBonusScore() : 0;
            int penalties = (report != null && report.getBreakdown() != null) ? report.getBreakdown().getTotalPenalties() : 0;
            long duration = (report != null) ? report.getTotalDurationSeconds() : 0;

            boolean isCompleted = session.getCompletedAt() != null || session.getFinalScore() != null;
            if (isCompleted) {
                completedCount++;
                sumScore += score;
                maxScore = Math.max(maxScore, score);
                if (passed) passedCount++;

                sumPpe += ppe;
                sumDetection += det;
                sumEvacuation += evac;
                sumContainment += cont;
                sumDecontamination += decon;
                sumTimeBonus += timeBonus;
            }

            attempts.add(AttemptProgressDTO.builder()
                    .attemptNumber(attemptCounter++)
                    .sessionId(session.getSessionId())
                    .scenarioCode(report != null ? report.getScenarioCode() : session.getScenarioId())
                    .scenarioTitle(report != null ? report.getScenarioTitle() : "CBRN Incident")
                    .startedAt(session.getStartedAt())
                    .completedAt(session.getCompletedAt())
                    .durationSeconds(duration)
                    .finalScore(score)
                    .passStatus(passStatus)
                    .passed(passed)
                    .ppeScore(ppe)
                    .detectionScore(det)
                    .evacuationScore(evac)
                    .containmentScore(cont)
                    .decontaminationScore(decon)
                    .timeBonusScore(timeBonus)
                    .totalPenalties(penalties)
                    .build());
        }

        List<AttemptProgressDTO> completedAttempts = attempts.stream()
                .filter(a -> a.getCompletedAt() != null || a.getFinalScore() > 0)
                .collect(Collectors.toList());

        int initialScore = completedAttempts.isEmpty() ? 0 : completedAttempts.get(0).getFinalScore();
        int latestScore = completedAttempts.isEmpty() ? 0 : completedAttempts.get(completedAttempts.size() - 1).getFinalScore();
        double avgScore = completedCount > 0 ? Math.round((sumScore / completedCount) * 10.0) / 10.0 : 0.0;
        double passRate = completedCount > 0 ? Math.round(((double) passedCount / completedCount * 100.0) * 10.0) / 10.0 : 0.0;

        // Skill Growth Calculation: ((latest - initial) / initial) * 100
        double growthPercentage;
        if (completedAttempts.size() > 1 && initialScore > 0) {
            growthPercentage = Math.round(((double) (latestScore - initialScore) / initialScore * 100.0) * 10.0) / 10.0;
        } else if (completedAttempts.size() > 1 && initialScore == 0 && latestScore > 0) {
            growthPercentage = 100.0;
        } else {
            growthPercentage = 0.0;
        }

        Map<String, Double> dimensionAverages = new LinkedHashMap<>();
        if (completedCount > 0) {
            dimensionAverages.put("PPE Protocol", Math.round((sumPpe / completedCount) * 10.0) / 10.0);
            dimensionAverages.put("Hazard Detection", Math.round((sumDetection / completedCount) * 10.0) / 10.0);
            dimensionAverages.put("Civilian Evacuation", Math.round((sumEvacuation / completedCount) * 10.0) / 10.0);
            dimensionAverages.put("Containment Sealing", Math.round((sumContainment / completedCount) * 10.0) / 10.0);
            dimensionAverages.put("Decontamination", Math.round((sumDecontamination / completedCount) * 10.0) / 10.0);
            dimensionAverages.put("Time Efficiency Bonus", Math.round((sumTimeBonus / completedCount) * 10.0) / 10.0);
        }

        return TraineeProgressionDTO.builder()
                .traineeId(trainee.getTraineeId())
                .traineeName(trainee.getName())
                .batchUnit(trainee.getBatchUnit())
                .totalAttempts(sessions.size())
                .completedAttempts(completedCount)
                .passedAttempts(passedCount)
                .passRatePercentage(passRate)
                .initialScore(initialScore)
                .latestScore(latestScore)
                .highestScore(maxScore)
                .averageScore(avgScore)
                .growthPercentage(growthPercentage)
                .dimensionAverages(dimensionAverages)
                .attemptHistory(attempts)
                .build();
    }
}

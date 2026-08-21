package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.DashboardStatsDTO;
import com.cbrsx.backend.dto.MistakeDetailDTO;
import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SessionRepository sessionRepository;
    private final TraineeRepository traineeRepository;
    private final ScoringService scoringService;

    public DashboardStatsDTO getDashboardStats() {
        List<TrainingSession> allSessions = sessionRepository.findAll();
        long totalTrainees = traineeRepository.count();

        List<TrainingSession> completedSessions = allSessions.stream()
                .filter(s -> "PASSED".equalsIgnoreCase(s.getPassStatus()) || "FAILED".equalsIgnoreCase(s.getPassStatus()))
                .collect(Collectors.toList());

        long totalCompleted = completedSessions.size();
        long passedCount = completedSessions.stream().filter(s -> "PASSED".equalsIgnoreCase(s.getPassStatus())).count();
        long failedCount = totalCompleted - passedCount;

        double passRate = totalCompleted > 0 ? (double) passedCount / totalCompleted * 100.0 : 0.0;
        double avgScore = totalCompleted > 0 ? completedSessions.stream()
                .mapToInt(s -> s.getFinalScore() != null ? s.getFinalScore() : 0)
                .average().orElse(0.0) : 0.0;

        Map<String, Long> passStatusCounts = new HashMap<>();
        passStatusCounts.put("PASSED", passedCount);
        passStatusCounts.put("FAILED", failedCount);
        passStatusCounts.put("IN_PROGRESS", (long) (allSessions.size() - totalCompleted));

        // Aggregate reports for recent sessions
        List<ScoreReportDTO> recentReports = new ArrayList<>();
        Map<String, Long> mistakeFrequencies = new HashMap<>();

        for (TrainingSession session : completedSessions.stream()
                .sorted((a, b) -> b.getStartedAt().compareTo(a.getStartedAt()))
                .limit(10)
                .collect(Collectors.toList())) {
            ScoreReportDTO report = scoringService.calculateAndFinalizeScore(session.getSessionId());
            recentReports.add(report);

            if (report.getMistakes() != null) {
                for (MistakeDetailDTO mistake : report.getMistakes()) {
                    mistakeFrequencies.put(mistake.getDescription(), mistakeFrequencies.getOrDefault(mistake.getDescription(), 0L) + 1);
                }
            }
        }

        return DashboardStatsDTO.builder()
                .totalTrainees(totalTrainees)
                .totalSessionsCompleted(totalCompleted)
                .overallPassRate(Math.round(passRate * 10.0) / 10.0)
                .averageScore(Math.round(avgScore * 10.0) / 10.0)
                .passStatusCounts(passStatusCounts)
                .topMistakesFrequency(mistakeFrequencies)
                .recentSessions(recentReports)
                .build();
    }
}

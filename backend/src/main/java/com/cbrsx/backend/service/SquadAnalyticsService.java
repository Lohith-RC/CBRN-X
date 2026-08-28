package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.SquadComparisonDTO;
import com.cbrsx.backend.dto.SquadSummaryDTO;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SquadAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(SquadAnalyticsService.class);

    private final SessionRepository sessionRepository;
    private final TraineeRepository traineeRepository;

    public SquadAnalyticsService(SessionRepository sessionRepository, TraineeRepository traineeRepository) {
        this.sessionRepository = sessionRepository;
        this.traineeRepository = traineeRepository;
    }

    @Transactional(readOnly = true)
    public SquadSummaryDTO getSquadSummary(String squadId) {
        if (squadId == null || squadId.isBlank()) {
            throw new IllegalArgumentException("squadId cannot be blank");
        }

        List<TrainingSession> sessions = sessionRepository.findBySquadId(squadId.toLowerCase().trim()).stream()
                .filter(s -> !"VOIDED".equalsIgnoreCase(s.getPassStatus()))
                .toList();

        Set<String> traineeIds = sessions.stream().map(TrainingSession::getTraineeId).collect(Collectors.toSet());
        List<Trainee> trainees = traineeRepository.findAllById(traineeIds);
        List<String> memberNames = trainees.stream().map(Trainee::getName).toList();

        int totalSessions = sessions.size();
        if (totalSessions == 0) {
            return new SquadSummaryDTO(
                    squadId,
                    0,
                    0,
                    0,
                    0.0,
                    0.0,
                    0,
                    100.0,
                    Collections.emptyMap(),
                    Collections.emptyList()
            );
        }

        long passedCount = sessions.stream().filter(s -> "PASSED".equalsIgnoreCase(s.getPassStatus()) || (s.getFinalScore() != null && s.getFinalScore() >= ScoringService.PASS_THRESHOLD)).count();
        double passRate = Math.round(((double) passedCount / totalSessions * 100.0) * 10.0) / 10.0;
        double avgScore = Math.round((sessions.stream().mapToInt(s -> s.getFinalScore() != null ? s.getFinalScore() : 0).average().orElse(0.0)) * 10.0) / 10.0;
        double teamComplianceRate = Math.max(0.0, Math.min(100.0, avgScore));

        Map<String, Integer> roleDist = new LinkedHashMap<>();
        roleDist.put("Entry Lead", 1);
        roleDist.put("Containment Specialist", 1);
        roleDist.put("Decontamination Tech", Math.max(1, traineeIds.size() - 2));

        return new SquadSummaryDTO(
                squadId,
                traineeIds.size(),
                totalSessions,
                (int) passedCount,
                passRate,
                avgScore,
                0,
                teamComplianceRate,
                roleDist,
                memberNames
        );
    }

    @Transactional(readOnly = true)
    public SquadComparisonDTO compareSquads() {
        List<String> standardSquads = List.of("alpha", "bravo", "charlie");
        List<SquadSummaryDTO> squadSummaries = new ArrayList<>();

        for (String sq : standardSquads) {
            squadSummaries.add(getSquadSummary(sq));
        }

        double overallAvg = squadSummaries.stream()
                .mapToDouble(SquadSummaryDTO::getAverageScore)
                .average()
                .orElse(0.0);
        overallAvg = Math.round(overallAvg * 10.0) / 10.0;

        String topSquad = squadSummaries.stream()
                .max(Comparator.comparingDouble(SquadSummaryDTO::getAverageScore))
                .map(SquadSummaryDTO::getSquadId)
                .orElse("alpha");

        return new SquadComparisonDTO(topSquad, overallAvg, squadSummaries);
    }
}

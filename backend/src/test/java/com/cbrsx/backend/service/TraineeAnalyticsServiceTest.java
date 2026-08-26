package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.ScoreBreakdownDTO;
import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.dto.TraineeProgressionDTO;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TraineeAnalyticsServiceTest {

    @Mock
    private TraineeRepository traineeRepository;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private ScoringService scoringService;

    @InjectMocks
    private TraineeAnalyticsService traineeAnalyticsService;

    private final String traineeId = "trn-prog-01";
    private Trainee trainee;

    @BeforeEach
    void setUp() {
        trainee = Trainee.builder()
                .traineeId(traineeId)
                .name("Constable Rahul Kumar")
                .batchUnit("10th NDRF Battalion")
                .build();
    }

    @Test
    void getTraineeProgression_MultipleAttempts_CalculatesAccurateGrowthTrend() {
        when(traineeRepository.findById(traineeId)).thenReturn(Optional.of(trainee));

        Instant t1 = Instant.now().minusSeconds(1000);
        Instant t2 = Instant.now().minusSeconds(500);
        Instant t3 = Instant.now().minusSeconds(100);

        TrainingSession s1 = TrainingSession.builder().sessionId("s1").traineeId(traineeId).scenarioId("scen-chem-01").startedAt(t1).completedAt(t1.plusSeconds(200)).finalScore(50).passStatus("FAILED").build();
        TrainingSession s2 = TrainingSession.builder().sessionId("s2").traineeId(traineeId).scenarioId("scen-chem-01").startedAt(t2).completedAt(t2.plusSeconds(180)).finalScore(75).passStatus("PASSED").build();
        TrainingSession s3 = TrainingSession.builder().sessionId("s3").traineeId(traineeId).scenarioId("scen-chem-01").startedAt(t3).completedAt(t3.plusSeconds(150)).finalScore(100).passStatus("PASSED").build();

        when(sessionRepository.findByTraineeIdOrderByStartedAtAsc(traineeId)).thenReturn(Arrays.asList(s1, s2, s3));

        ScoreBreakdownDTO b1 = ScoreBreakdownDTO.builder().ppeScore(5).detectionScore(5).evacuationScore(10).containmentScore(0).decontaminationScore(10).timeBonusScore(10).totalPenalties(0).build();
        ScoreBreakdownDTO b2 = ScoreBreakdownDTO.builder().ppeScore(10).detectionScore(10).evacuationScore(15).containmentScore(15).decontaminationScore(0).timeBonusScore(15).totalPenalties(10).build();
        ScoreBreakdownDTO b3 = ScoreBreakdownDTO.builder().ppeScore(10).detectionScore(10).evacuationScore(15).containmentScore(15).decontaminationScore(10).timeBonusScore(20).totalPenalties(0).build();

        when(scoringService.previewScore("s1")).thenReturn(ScoreReportDTO.builder().sessionId("s1").scenarioCode("CBRN-CHEM-01").scenarioTitle("Chemical Spill").startedAt(t1).completedAt(t1.plusSeconds(200)).totalDurationSeconds(200).finalScore(50).passStatus("FAILED").passed(false).breakdown(b1).build());
        when(scoringService.previewScore("s2")).thenReturn(ScoreReportDTO.builder().sessionId("s2").scenarioCode("CBRN-CHEM-01").scenarioTitle("Chemical Spill").startedAt(t2).completedAt(t2.plusSeconds(180)).totalDurationSeconds(180).finalScore(75).passStatus("PASSED").passed(true).breakdown(b2).build());
        when(scoringService.previewScore("s3")).thenReturn(ScoreReportDTO.builder().sessionId("s3").scenarioCode("CBRN-CHEM-01").scenarioTitle("Chemical Spill").startedAt(t3).completedAt(t3.plusSeconds(150)).totalDurationSeconds(150).finalScore(100).passStatus("PASSED").passed(true).breakdown(b3).build());

        TraineeProgressionDTO result = traineeAnalyticsService.getTraineeProgression(traineeId);

        assertNotNull(result);
        assertEquals(traineeId, result.getTraineeId());
        assertEquals("Constable Rahul Kumar", result.getTraineeName());
        assertEquals(3, result.getTotalAttempts());
        assertEquals(3, result.getCompletedAttempts());
        assertEquals(2, result.getPassedAttempts());
        assertEquals(66.7, result.getPassRatePercentage(), 0.1);

        assertEquals(50, result.getInitialScore());
        assertEquals(100, result.getLatestScore());
        assertEquals(100, result.getHighestScore());
        assertEquals(75.0, result.getAverageScore(), 0.1);

        // Growth: ((100 - 50) / 50) * 100 = +100.0%
        assertEquals(100.0, result.getGrowthPercentage(), 0.1);

        assertEquals(3, result.getAttemptHistory().size());
        assertEquals(1, result.getAttemptHistory().get(0).getAttemptNumber());
        assertEquals(3, result.getAttemptHistory().get(2).getAttemptNumber());
        assertEquals(100, result.getAttemptHistory().get(2).getFinalScore());

        assertNotNull(result.getDimensionAverages());
        assertTrue(result.getDimensionAverages().containsKey("PPE Protocol"));
    }

    @Test
    void getTraineeProgression_SingleAttempt_GrowthIsZero() {
        when(traineeRepository.findById(traineeId)).thenReturn(Optional.of(trainee));

        Instant t1 = Instant.now().minusSeconds(100);
        TrainingSession s1 = TrainingSession.builder().sessionId("s1").traineeId(traineeId).scenarioId("scen-chem-01").startedAt(t1).completedAt(t1.plusSeconds(150)).finalScore(85).passStatus("PASSED").build();

        when(sessionRepository.findByTraineeIdOrderByStartedAtAsc(traineeId)).thenReturn(Collections.singletonList(s1));
        when(scoringService.previewScore("s1")).thenReturn(ScoreReportDTO.builder().sessionId("s1").scenarioCode("CBRN-CHEM-01").scenarioTitle("Chemical Spill").startedAt(t1).completedAt(t1.plusSeconds(150)).totalDurationSeconds(150).finalScore(85).passStatus("PASSED").passed(true).breakdown(ScoreBreakdownDTO.builder().build()).build());

        TraineeProgressionDTO result = traineeAnalyticsService.getTraineeProgression(traineeId);

        assertNotNull(result);
        assertEquals(1, result.getTotalAttempts());
        assertEquals(85, result.getInitialScore());
        assertEquals(85, result.getLatestScore());
        assertEquals(0.0, result.getGrowthPercentage());
    }

    @Test
    void getTraineeProgression_NoSessions_ReturnsEmptyStructure() {
        when(traineeRepository.findById(traineeId)).thenReturn(Optional.of(trainee));
        when(sessionRepository.findByTraineeIdOrderByStartedAtAsc(traineeId)).thenReturn(Collections.emptyList());

        TraineeProgressionDTO result = traineeAnalyticsService.getTraineeProgression(traineeId);

        assertNotNull(result);
        assertEquals(0, result.getTotalAttempts());
        assertEquals(0, result.getCompletedAttempts());
        assertEquals(0.0, result.getGrowthPercentage());
        assertTrue(result.getAttemptHistory().isEmpty());
    }

    @Test
    void getTraineeProgression_NonExistentTrainee_ThrowsException() {
        when(traineeRepository.findById("unknown")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                traineeAnalyticsService.getTraineeProgression("unknown")
        );
    }

    @Test
    void getBattalionLeaderboard_AggregatesAndRanksTrainees() {
        Trainee t1 = Trainee.builder().traineeId("trn-1").name("Alpha Responder").batchUnit("10th NDRF Battalion").build();
        Trainee t2 = Trainee.builder().traineeId("trn-2").name("Beta Responder").batchUnit("10th NDRF Battalion").build();

        when(traineeRepository.findAll()).thenReturn(Arrays.asList(t1, t2));

        TrainingSession s1 = TrainingSession.builder().sessionId("s1").traineeId("trn-1").finalScore(95).passStatus("PASSED").startedAt(Instant.now()).build();
        TrainingSession s2 = TrainingSession.builder().sessionId("s2").traineeId("trn-2").finalScore(75).passStatus("PASSED").startedAt(Instant.now()).build();

        when(sessionRepository.findByTraineeIdOrderByStartedAtAsc("trn-1")).thenReturn(Collections.singletonList(s1));
        when(sessionRepository.findByTraineeIdOrderByStartedAtAsc("trn-2")).thenReturn(Collections.singletonList(s2));

        var leaderboard = traineeAnalyticsService.getBattalionLeaderboard(null);

        assertEquals(2, leaderboard.size());
        assertEquals("trn-1", leaderboard.get(0).getTraineeId());
        assertEquals(95, leaderboard.get(0).getBestScore());
        assertEquals("trn-2", leaderboard.get(1).getTraineeId());
        assertEquals(75, leaderboard.get(1).getBestScore());
    }
}

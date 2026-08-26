package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.DashboardStatsDTO;
import com.cbrsx.backend.entity.Scenario;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.EventRepository;
import com.cbrsx.backend.repository.ScenarioRepository;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private TraineeRepository traineeRepository;

    @Mock
    private ScenarioRepository scenarioRepository;

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    @DisplayName("getDashboardStats: Aggregates metrics correctly")
    void getDashboardStats_CalculatesAggregatesCorrectly() {
        when(traineeRepository.count()).thenReturn(15L);
        when(sessionRepository.countCompletedSessions()).thenReturn(10L);
        when(sessionRepository.averageFinalScoreOfCompleted()).thenReturn(88.5);
        when(sessionRepository.countByPassStatusIgnoreCase("PASSED")).thenReturn(8L);
        when(sessionRepository.countByPassStatusIgnoreCase("VOIDED")).thenReturn(0L);

        TrainingSession session = TrainingSession.builder()
                .sessionId("sess-01")
                .traineeId("trn-01")
                .scenarioId("scen-01")
                .finalScore(90)
                .passStatus("PASSED")
                .startedAt(Instant.now().minusSeconds(300))
                .completedAt(Instant.now())
                .build();

        Trainee trainee = Trainee.builder().traineeId("trn-01").name("Monica K S").batchUnit("NDRF").build();
        Scenario scenario = Scenario.builder().scenarioId("scen-01").code("CBRN-CHEM-01").title("Chem Attack").build();

        when(sessionRepository.findTop10ByPassStatusNotIgnoreCaseOrderByStartedAtDesc("VOIDED"))
                .thenReturn(List.of(session));
        when(traineeRepository.findAllById(Collections.singleton("trn-01"))).thenReturn(List.of(trainee));
        when(scenarioRepository.findAllById(Collections.singleton("scen-01"))).thenReturn(List.of(scenario));

        DashboardStatsDTO stats = dashboardService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(15L, stats.getTotalTrainees());
        assertEquals(10L, stats.getTotalSessionsCompleted());
        assertEquals(88.5, stats.getAverageScore());
        assertEquals(80.0, stats.getOverallPassRate(), 0.01);
        assertEquals(1, stats.getRecentSessions().size());
        assertEquals("Monica K S", stats.getRecentSessions().get(0).getTraineeName());
    }
}

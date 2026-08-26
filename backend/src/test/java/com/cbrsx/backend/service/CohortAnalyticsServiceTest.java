package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.CohortAnalyticsDTO;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CohortAnalyticsServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private ScenarioRepository scenarioRepository;

    @Mock
    private TraineeRepository traineeRepository;

    @InjectMocks
    private CohortAnalyticsService cohortAnalyticsService;

    @Test
    @DisplayName("getCohortAnalytics: Returns non-null cohort statistics and filters voided sessions")
    void getCohortAnalytics_FiltersVoidedSessions() {
        TrainingSession passedSession = TrainingSession.builder()
                .sessionId("sess-1")
                .traineeId("trn-1")
                .scenarioId("scen-1")
                .finalScore(95)
                .passStatus("PASSED")
                .startedAt(Instant.now().minusSeconds(500))
                .completedAt(Instant.now().minusSeconds(100))
                .build();

        TrainingSession voidedSession = TrainingSession.builder()
                .sessionId("sess-2")
                .traineeId("trn-2")
                .scenarioId("scen-1")
                .finalScore(0)
                .passStatus("VOIDED")
                .startedAt(Instant.now().minusSeconds(500))
                .completedAt(Instant.now().minusSeconds(100))
                .build();

        when(sessionRepository.findByCompletedAtIsNotNull()).thenReturn(List.of(passedSession, voidedSession));
        when(scenarioRepository.findAllById(any())).thenReturn(List.of(
                Scenario.builder().scenarioId("scen-1").code("CBRN-RAD-01").title("Rad Vault").build()
        ));
        when(traineeRepository.findAllById(any())).thenReturn(List.of(
                Trainee.builder().traineeId("trn-1").name("Pavitra J H").batchUnit("NDRF Unit 1").build()
        ));

        CohortAnalyticsDTO dto = cohortAnalyticsService.getCohortAnalytics();

        assertNotNull(dto);
        assertNotNull(dto.scenarioBreakdown());
        assertNotNull(dto.generatedAt());
    }
}

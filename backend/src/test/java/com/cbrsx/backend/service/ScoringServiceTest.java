package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.entity.Scenario;
import com.cbrsx.backend.entity.SessionEvent;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.EventRepository;
import com.cbrsx.backend.repository.ScenarioRepository;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScoringServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private TraineeRepository traineeRepository;

    @Mock
    private ScenarioRepository scenarioRepository;

    @InjectMocks
    private ScoringService scoringService;

    private String sessionId = "sess-test-01";
    private TrainingSession session;

    @BeforeEach
    void setUp() {
        session = TrainingSession.builder()
                .sessionId(sessionId)
                .traineeId("trn-01")
                .scenarioId("scen-chem-01")
                .startedAt(Instant.now().minusSeconds(150)) // 2.5 minutes duration
                .completedAt(Instant.now())
                .passStatus("IN_PROGRESS")
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(traineeRepository.findById("trn-01")).thenReturn(Optional.of(
                Trainee.builder().traineeId("trn-01").name("Lohith R C").batchUnit("NDRF Unit 10").build()
        ));
        when(scenarioRepository.findById("scen-chem-01")).thenReturn(Optional.of(
                Scenario.builder().scenarioId("scen-chem-01").code("CBRN-CHEM-01").title("Chemical Spill").build()
        ));
    }

    @Test
    void calculateAndFinalizeScore_PerfectRun_ShouldPassWith100() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(130)).build(),
                SessionEvent.builder().eventType("detector_equipped").timestamp(Instant.now().minusSeconds(110)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").eventData("{\"civilian_id\":1}").timestamp(Instant.now().minusSeconds(70)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").eventData("{\"civilian_id\":2}").timestamp(Instant.now().minusSeconds(50)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(30)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(10)).build(),
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );

        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.calculateAndFinalizeScore(sessionId);

        assertNotNull(report);
        assertTrue(report.isPassed());
        assertEquals("PASSED", report.getPassStatus());
        assertEquals(100, report.getFinalScore());
        assertTrue(report.getMistakes().isEmpty());
    }

    @Test
    void calculateAndFinalizeScore_FlawedRun_ShouldApplyPenalties() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("entered_hazard_zone_without_ppe").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":false}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("evacuation_incomplete").eventData("{\"count\":1}").timestamp(Instant.now().minusSeconds(50)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(30)).build()
                // Skipping decontamination
        );

        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.calculateAndFinalizeScore(sessionId);

        assertNotNull(report);
        assertFalse(report.isPassed());
        assertEquals("FAILED", report.getPassStatus());
        assertTrue(report.getFinalScore() < 70);
        assertFalse(report.getMistakes().isEmpty());
    }
}

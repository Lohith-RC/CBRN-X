package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.DebriefReportDTO;
import com.cbrsx.backend.dto.ScoreBreakdownDTO;
import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.entity.SessionEvent;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.EventRepository;
import com.cbrsx.backend.repository.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DebriefServiceTest {

    @Mock
    private ScoringService scoringService;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private DebriefService debriefService;

    private String sessionId = "sess-debrief-01";
    private TrainingSession session;

    @BeforeEach
    void setUp() {
        session = TrainingSession.builder()
                .sessionId(sessionId)
                .traineeId("trn-01")
                .scenarioId("scen-chem-01")
                .startedAt(Instant.now().minusSeconds(120))
                .completedAt(Instant.now())
                .passStatus("PASSED")
                .finalScore(100)
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
    }

    @Test
    void generateDebrief_PerfectSession_ShouldYieldAlphaRating() {
        ScoreReportDTO scoreReport = ScoreReportDTO.builder()
                .sessionId(sessionId)
                .traineeId("trn-01")
                .traineeName("Lohith R C")
                .batchUnit("NDRF Unit 10")
                .scenarioCode("CBRN-CHEM-01")
                .scenarioTitle("Chemical Spill")
                .totalDurationSeconds(120)
                .finalScore(100)
                .passStatus("PASSED")
                .passed(true)
                .breakdown(ScoreBreakdownDTO.builder()
                        .ppeScore(10)
                        .detectionScore(10)
                        .evacuationScore(15)
                        .containmentScore(15)
                        .decontaminationScore(10)
                        .timeBonusScore(20)
                        .totalPenalties(0)
                        .netScore(80)
                        .build())
                .mistakes(new ArrayList<>())
                .recommendations(Arrays.asList("Excellent response!"))
                .build();

        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(120)).build(),
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(110)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(10)).build()
        );

        when(scoringService.previewScore(sessionId)).thenReturn(scoreReport);
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        DebriefReportDTO debrief = debriefService.generateDebrief(sessionId);

        assertNotNull(debrief);
        assertEquals("sess-debrief-01", debrief.getSessionId());
        assertTrue(debrief.isPassed());
        assertTrue(debrief.getTacticalRating().startsWith("ALPHA"));
        assertFalse(debrief.getOperationalStrengths().isEmpty());
        assertNotNull(debrief.getTimelineAnalysis());
        assertEquals(6, debrief.getTimelineAnalysis().size());
        assertTrue(debrief.getResponseVelocityAssessment().contains("RAPID NEUTRALIZATION"));
    }
}

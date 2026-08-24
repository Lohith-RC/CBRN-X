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
    void finalizeSession_PerfectRun_ShouldPassWith100() {
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

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        assertTrue(report.isPassed());
        assertEquals("PASSED", report.getPassStatus());
        assertEquals(100, report.getFinalScore());
        assertTrue(report.getMistakes().isEmpty());
    }

    @Test
    void finalizeSession_FlawedRun_ShouldApplyPenalties() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("entered_hazard_zone_without_ppe").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":false}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("evacuation_incomplete").eventData("{\"count\":1}").timestamp(Instant.now().minusSeconds(50)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(30)).build()
                // Skipping decontamination
        );

        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        assertFalse(report.isPassed());
        assertEquals("FAILED", report.getPassStatus());
        assertTrue(report.getFinalScore() < 70);
        assertFalse(report.getMistakes().isEmpty());
    }

    @Test
    void finalizeSession_DetectorNeverEquippedButLeakFlagged_ShouldNotCrash() {
        // Detector is never equipped, but a leak_source_identified event still fires.
        // The scoring engine should handle this gracefully (detection score depends
        // only on correctness of identification, not on detector_equipped presence).
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(130)).build(),
                // NOTE: no detector_equipped event
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(70)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(50)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(30)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(10)).build(),
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );

        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        // Detection score should still be awarded for correct identification
        assertEquals(10, report.getBreakdown().getDetectionScore());
        // Should not crash — the test itself passing is the primary assertion
    }

    @Test
    void finalizeSession_OneOfTwoEvacuated_ShouldApplyPartialCreditAndPenalty() {
        // Exactly 1 civilian evacuated, 1 left behind.
        // Expected: evacuationScore = 5 * 1 = 5 (partial credit)
        //           penalty         = 10 * 1 = 10 (left-behind penalty)
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(130)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(70)).build(),
                // Only 1 evacuated; evacuation_incomplete with count=1 left behind
                SessionEvent.builder().eventType("evacuation_incomplete").eventData("{\"count\":1}").timestamp(Instant.now().minusSeconds(55)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(30)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(10)).build()
        );

        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        // Partial credit: 5 points per evacuated civilian
        assertEquals(5, report.getBreakdown().getEvacuationScore());
        // Left-behind penalty: 10 points per civilian left behind
        // Total penalties include only the left-behind penalty (10)
        assertEquals(10, report.getBreakdown().getTotalPenalties());
    }

    @Test
    void finalizeSession_EvacuationOverage_ShouldCapComponentScore() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(70)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(50)).build(),
                SessionEvent.builder().eventType("evacuation_incomplete").eventData("{\"count\":1}").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(30)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(10)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(15, report.getBreakdown().getEvacuationScore());
        assertEquals(10, report.getBreakdown().getTotalPenalties());
    }

    @Test
    void finalizeSession_ContainmentCompletedTwice_ShouldNotDoubleCount() {
        // containment_completed fires twice — verify containment score is still 15 (not 30).
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(130)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(70)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(50)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(35)).build(), // duplicate
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(10)).build()
        );

        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        // Containment score must be exactly 15 — not double-counted
        assertEquals(15, report.getBreakdown().getContainmentScore());
        // With perfect run + time bonus 20, raw = 10+10+15+15+10+20 = 80, net 80, final 100
        assertEquals(100, report.getFinalScore());
    }

    @Test
    void finalizeSession_EvacuationIncompleteWithExtraNumericFields_ShouldParseCorrectCount() {
        // event_data JSON contains a timestamp and a drum_id alongside the count field.
        // The old regex approach would have concatenated all digits (e.g. "17356890001232" → wrong).
        // extractCount-based parsing should extract only the "count" field value.
        String eventDataWithExtraNumbers = "{\"count\":2,\"timestamp\":1735689000,\"drum_id\":\"DRUM-123\"}";

        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(130)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(70)).build(),
                SessionEvent.builder().eventType("evacuation_incomplete").eventData(eventDataWithExtraNumbers).timestamp(Instant.now().minusSeconds(55)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(30)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(10)).build()
        );

        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        // The left-behind penalty should be 10 * 2 = 20 (count=2, not some garbled number)
        assertEquals(20, report.getBreakdown().getTotalPenalties());
        // Evacuation score: 1 evacuated * 5 = 5
        assertEquals(5, report.getBreakdown().getEvacuationScore());
        // Verify the mistake description references the correct count
        assertTrue(report.getMistakes().stream()
                .anyMatch(m -> m.getDescription().contains("2 civilian(s)")));
    }

    @Test
    void finalizeSession_ContainmentSkipped_PenaltyMustBeTotaled() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(50)).build(),
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(15, report.getBreakdown().getTotalPenalties());
        assertEquals(15, report.getMistakes().stream()
                .filter(m -> m.getDescription().contains("containment sealant"))
                .findFirst().orElseThrow().getDeductionPoints());
    }

    @Test
    void finalizeSession_EvacuationCountParsing_ShouldReadCountFieldOnly() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("evacuation_incomplete")
                        .eventData("{\"count\":2,\"unit_id\":7}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(45, report.getBreakdown().getTotalPenalties());
        assertEquals(3, report.getMistakes().size());
    }
}

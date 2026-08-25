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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
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

    @org.mockito.Spy
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @InjectMocks
    private ScoringService scoringService;

    private final String sessionId = "sess-test-01";
    private TrainingSession session;

    @BeforeEach
    void setUp() {
        session = TrainingSession.builder()
                .sessionId(sessionId)
                .traineeId("trn-01")
                .scenarioId("scen-chem-01")
                .startedAt(Instant.now().minusSeconds(150)) // 2.5 minutes duration (Tier: Excellent)
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

    // =========================================================================
    // 1. PERFECT RUNS ACROSS MULTI-HAZARD SCENARIOS
    // =========================================================================

    @Test
    @DisplayName("Chemical Perfect Run: Full compliance awards 100/100 and PASSED status")
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
        assertEquals(0, report.getBreakdown().getTotalPenalties());
        assertTrue(report.getMistakes().isEmpty());
    }

    @Test
    @DisplayName("Radiological Perfect Run: Full lead shielding and isotope containment awards 100/100")
    void finalizeSession_RadiologicalPerfectRun_ShouldPassWith100() {
        when(scenarioRepository.findById("scen-chem-01")).thenReturn(Optional.of(
                Scenario.builder().scenarioId("scen-rad-02").code("CBRN-RAD-02").title("Radiological Vault").build()
        ));

        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("lead_apron_equipped").timestamp(Instant.now().minusSeconds(130)).build(),
                SessionEvent.builder().eventType("dosimeter_equipped").timestamp(Instant.now().minusSeconds(110)).build(),
                SessionEvent.builder().eventType("rad_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("technician_extracted").eventData("{\"tech_id\":1}").timestamp(Instant.now().minusSeconds(70)).build(),
                SessionEvent.builder().eventType("technician_extracted").eventData("{\"tech_id\":2}").timestamp(Instant.now().minusSeconds(50)).build(),
                SessionEvent.builder().eventType("shielding_blanket_deployed").timestamp(Instant.now().minusSeconds(30)).build(),
                SessionEvent.builder().eventType("rad_washdown_completed").timestamp(Instant.now().minusSeconds(10)).build(),
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        assertTrue(report.isPassed());
        assertEquals(100, report.getFinalScore());
        assertTrue(report.getMistakes().isEmpty());
    }

    @Test
    @DisplayName("Biological Perfect Run: PAPR and negative pressure airlock isolation awards 100/100")
    void finalizeSession_BiologicalPerfectRun_ShouldPassWith100() {
        when(scenarioRepository.findById("scen-chem-01")).thenReturn(Optional.of(
                Scenario.builder().scenarioId("scen-bio-03").code("CBRN-BIO-03").title("Level-4 Pathogen Lab").build()
        ));

        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("papr_donning_completed").timestamp(Instant.now().minusSeconds(130)).build(),
                SessionEvent.builder().eventType("bio_sampler_equipped").timestamp(Instant.now().minusSeconds(110)).build(),
                SessionEvent.builder().eventType("pathogen_breach_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("lab_personnel_evacuated").eventData("{\"staff_id\":1}").timestamp(Instant.now().minusSeconds(70)).build(),
                SessionEvent.builder().eventType("lab_personnel_evacuated").eventData("{\"staff_id\":2}").timestamp(Instant.now().minusSeconds(50)).build(),
                SessionEvent.builder().eventType("airlock_sealed").timestamp(Instant.now().minusSeconds(30)).build(),
                SessionEvent.builder().eventType("autoclave_sterilization_completed").timestamp(Instant.now().minusSeconds(10)).build(),
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        assertTrue(report.isPassed());
        assertEquals(100, report.getFinalScore());
        assertTrue(report.getMistakes().isEmpty());
    }

    // =========================================================================
    // 2. STAGE-BY-STAGE ISOLATION & SKIPPING TESTS
    // =========================================================================

    @Test
    @DisplayName("Stage 1 (PPE): Stepping in without PPE applies penalty and denies full PPE score")
    void test_Stage1_SkipPpeDonning_EnterWithoutPpe_ZeroPpeScoreAndPenalty() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("entered_hazard_zone_without_ppe").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(0, report.getBreakdown().getPpeScore(), "PPE score should be 0 when PPE was never donned");
        assertEquals(15, report.getBreakdown().getTotalPenalties(), "Should apply 15 point penalty for entering without PPE");
    }

    @Test
    @DisplayName("Stage 1 (PPE): Donning PPE but subsequently triggering enter_without_ppe awards half credit with penalty")
    void test_Stage1_DonPpeThenEnterWithoutPpe_HalfPpeCreditAndPenalty() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("entered_hazard_zone_without_ppe").timestamp(Instant.now().minusSeconds(130)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(5, report.getBreakdown().getPpeScore(), "PPE score should be 5 (half credit of 10) when donned but violated");
        assertEquals(15, report.getBreakdown().getTotalPenalties());
    }

    @Test
    @DisplayName("Stage 2 (Detection): Flagging only wrong drums gives 0 detection score and penalizes per wrong scan")
    void test_Stage2_SkipDetection_WrongScansOnly_ZeroDetectionScore() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":false}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(0, report.getBreakdown().getDetectionScore());
        assertEquals(5, report.getBreakdown().getTotalPenalties());
    }

    @Test
    @DisplayName("Stage 2 (Detection): Multiple wrong drum scans accumulate multiple 5-point penalties")
    void test_Stage2_MultipleWrongDrumScans_AccumulatesMultiplePenalties() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":false}").timestamp(Instant.now().minusSeconds(120)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":false}").timestamp(Instant.now().minusSeconds(110)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":false}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(90)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(5, report.getBreakdown().getDetectionScore(), "Correct identification after false scans awards half credit (5 pts)");
        assertEquals(15, report.getBreakdown().getTotalPenalties(), "3 wrong scans must yield 15 points total deduction");
    }

    @Test
    @DisplayName("Stage 3 (Evacuation): Skipping civilian evacuation yields 0 evacuation score")
    void test_Stage3_ZeroCiviliansEvacuated_NoLeftBehindEvent_ZeroEvacScore() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                // No civilian_evacuated event
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(0, report.getBreakdown().getEvacuationScore());
    }

    @Test
    @DisplayName("Stage 3 (Evacuation): Evacuating 1 civilian with 0 left behind awards partial credit (5 pts)")
    void test_Stage3_EvacuateOneCivilian_LeavesZeroBehind_AwardsFivePoints() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(5, report.getBreakdown().getEvacuationScore(), "1 civilian evacuated gives 5 points");
        assertEquals(0, report.getBreakdown().getTotalPenalties());
    }

    @Test
    @DisplayName("Stage 3 (Evacuation): Evacuating 3+ civilians is capped at EVACUATION_MAX_SCORE (15 pts)")
    void test_Stage3_EvacuateThreeCivilians_CappedAtMaxEvacScore() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(70)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(15, report.getBreakdown().getEvacuationScore(), "Evacuation score must be hard-capped at 15 points");
    }

    @Test
    @DisplayName("Stage 4 (Containment): Skipping containment seals results in 0 score and 15 pt penalty")
    void test_Stage4_SkipContainment_FullPenaltyAndZeroContainmentScore() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                // containment_completed skipped
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(0, report.getBreakdown().getContainmentScore());
        assertEquals(15, report.getBreakdown().getTotalPenalties());
    }

    @Test
    @DisplayName("Stage 5 (Decontamination): Skipping decontamination results in 0 score and 10 pt penalty")
    void test_Stage5_SkipDecontamination_FullPenaltyAndZeroDeconScore() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build()
                // decontamination_completed skipped
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(0, report.getBreakdown().getDecontaminationScore());
        assertEquals(10, report.getBreakdown().getTotalPenalties());
    }

    // =========================================================================
    // 3. TIME EFFICIENCY BONUS TIERS
    // =========================================================================

    @Test
    @DisplayName("Stage 6 (Time Bonus): Duration <= 180s awards 20 points (Tier: Excellent)")
    void test_Stage6_TimeBonusTier_Excellent_Under180s_Awards20Points() {
        session.setStartedAt(Instant.now().minusSeconds(120)); // 2 minutes

        List<SessionEvent> events = Collections.singletonList(
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);
        assertEquals(20, report.getBreakdown().getTimeBonusScore());
    }

    @Test
    @DisplayName("Stage 6 (Time Bonus): Duration between 181s and 300s awards 15 points (Tier: Good)")
    void test_Stage6_TimeBonusTier_Good_Between181And300s_Awards15Points() {
        session.setStartedAt(Instant.now().minusSeconds(240)); // 4 minutes

        List<SessionEvent> events = Collections.singletonList(
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);
        assertEquals(15, report.getBreakdown().getTimeBonusScore());
    }

    @Test
    @DisplayName("Stage 6 (Time Bonus): Duration between 301s and 450s awards 10 points (Tier: Acceptable)")
    void test_Stage6_TimeBonusTier_Acceptable_Between301And450s_Awards10Points() {
        session.setStartedAt(Instant.now().minusSeconds(380)); // 6.3 minutes

        List<SessionEvent> events = Collections.singletonList(
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);
        assertEquals(10, report.getBreakdown().getTimeBonusScore());
    }

    @Test
    @DisplayName("Stage 6 (Time Bonus): Duration > 450s awards 5 points (Tier: Prolonged)")
    void test_Stage6_TimeBonusTier_Prolonged_Over450s_Awards5Points() {
        session.setStartedAt(Instant.now().minusSeconds(600)); // 10 minutes

        List<SessionEvent> events = Collections.singletonList(
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);
        assertEquals(5, report.getBreakdown().getTimeBonusScore());
    }

    // =========================================================================
    // 4. BOUNDARY & ARITHMETIC NORMALIZATION CONDITIONS (>= 70% PASS THRESHOLD)
    // =========================================================================

    @Test
    @DisplayName("Boundary Pass: Exact 75% score (net 60/80) results in PASSED")
    void test_BoundaryPassCondition_AboveOrEqual70Percent_ShouldPass() {
        // Raw Positive: PPE(5) + Det(10) + Evac(15) + Cont(15) + Decon(10) + Time(20) = 75
        // Penalty: Enter without PPE = 15
        // Net Score: 75 - 15 = 60 -> (60/80)*100 = 75%
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("entered_hazard_zone_without_ppe").timestamp(Instant.now().minusSeconds(130)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(75, report.getFinalScore());
        assertTrue(report.isPassed());
        assertEquals("PASSED", report.getPassStatus());
    }

    @Test
    @DisplayName("Boundary Fail: Exact 69% score (net 55/80) results in FAILED")
    void test_BoundaryFailCondition_Exact69Percent_ShouldFail() {
        // Duration: 240s -> Time bonus = 15
        // Raw Positive: PPE(5) + Det(10) + Evac(15) + Cont(15) + Decon(10) + Time(15) = 70
        // Penalty: Enter without PPE = 15
        // Net Score: 70 - 15 = 55 -> (55/80)*100 = 68.75 -> rounded to 69%
        session.setStartedAt(Instant.now().minusSeconds(240));

        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(230)).build(),
                SessionEvent.builder().eventType("entered_hazard_zone_without_ppe").timestamp(Instant.now().minusSeconds(220)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(180)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(69, report.getFinalScore());
        assertFalse(report.isPassed());
        assertEquals("FAILED", report.getPassStatus());
    }

    // =========================================================================
    // 5. PROTOCOL RE-ORDERING & IDEMPOTENCE
    // =========================================================================

    @Test
    @DisplayName("Re-ordered Protocol: Containment executed before Evacuation still scores accurately")
    void test_ReorderedProtocol_ContainmentBeforeEvacuation_ScoresCorrectly() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(120)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(100)).build(), // Executed early
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(100, report.getFinalScore());
        assertTrue(report.isPassed());
    }

    // =========================================================================
    // 6. ANTI-GAMING & INPUT CLAMPING ROBUSTNESS
    // =========================================================================

    @Test
    @DisplayName("Anti-Gaming: Inflated civilian left behind count is clamped to domain max (50)")
    void test_AntiGaming_OverflowCivilianCount_ClampsToFifty() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("evacuation_incomplete").eventData("{\"count\":999999999}").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        // Left behind penalty capped at 100 max, clamped without integer overflow
        assertEquals(100, report.getBreakdown().getTotalPenalties());
    }

    @Test
    @DisplayName("Anti-Gaming: Negative civilian count in JSON is clamped to safe default")
    void test_AntiGaming_NegativeCivilianCount_ClampedToSafeDefault() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("evacuation_incomplete").eventData("{\"count\":-10}").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertNotNull(report);
        // -10 clamped to 1 -> penalty = 10 * 1 = 10
        assertEquals(10, report.getBreakdown().getTotalPenalties());
    }

    @Test
    @DisplayName("Telemetry Liveness: Heartbeat and spatial coordinates do not affect score or unrecognized count")
    void test_BenignTelemetryEvents_HeartbeatAndSpatial_DoesNotAffectScoreOrUnrecognizedCount() {
        List<SessionEvent> events = Arrays.asList(
                SessionEvent.builder().eventType("scenario_started").timestamp(Instant.now().minusSeconds(145)).build(),
                SessionEvent.builder().eventType("trainee_heartbeat").eventData("{\"bpm\":82}").timestamp(Instant.now().minusSeconds(140)).build(),
                SessionEvent.builder().eventType("spatial_telemetry").eventData("{\"pos\":[10,0,5]}").timestamp(Instant.now().minusSeconds(135)).build(),
                SessionEvent.builder().eventType("ppe_donning_completed").timestamp(Instant.now().minusSeconds(130)).build(),
                SessionEvent.builder().eventType("leak_source_identified").eventData("{\"correct\":true}").timestamp(Instant.now().minusSeconds(100)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(80)).build(),
                SessionEvent.builder().eventType("civilian_evacuated").timestamp(Instant.now().minusSeconds(60)).build(),
                SessionEvent.builder().eventType("containment_completed").timestamp(Instant.now().minusSeconds(40)).build(),
                SessionEvent.builder().eventType("decontamination_completed").timestamp(Instant.now().minusSeconds(20)).build(),
                SessionEvent.builder().eventType("scenario_completed").timestamp(Instant.now()).build()
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        ScoreReportDTO report = scoringService.finalizeSession(sessionId);

        assertEquals(100, report.getFinalScore());
        assertEquals(0, report.getUnrecognizedEventCount(), "Heartbeat and spatial telemetry must not be flagged as unrecognized");
    }
}

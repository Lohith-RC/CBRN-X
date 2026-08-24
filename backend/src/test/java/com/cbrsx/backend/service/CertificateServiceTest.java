package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.ScoreBreakdownDTO;
import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private ScoringService scoringService;

    @InjectMocks
    private CertificateService certificateService;

    private final String passedSessionId = "sess-cert-pass-01";
    private final String failedSessionId = "sess-cert-fail-02";

    private TrainingSession passedSession;
    private TrainingSession failedSession;
    private ScoreReportDTO passedReport;
    private ScoreReportDTO failedReport;

    @BeforeEach
    void setUp() {
        passedSession = TrainingSession.builder()
                .sessionId(passedSessionId)
                .traineeId("trn-01")
                .scenarioId("scen-chem-01")
                .startedAt(Instant.now().minusSeconds(150))
                .completedAt(Instant.now())
                .finalScore(95)
                .passStatus("PASSED")
                .build();

        failedSession = TrainingSession.builder()
                .sessionId(failedSessionId)
                .traineeId("trn-02")
                .scenarioId("scen-chem-01")
                .startedAt(Instant.now().minusSeconds(150))
                .completedAt(Instant.now())
                .finalScore(55)
                .passStatus("FAILED")
                .build();

        ScoreBreakdownDTO breakdown = ScoreBreakdownDTO.builder()
                .ppeScore(10)
                .detectionScore(10)
                .evacuationScore(15)
                .containmentScore(15)
                .decontaminationScore(10)
                .timeBonusScore(20)
                .totalPenalties(0)
                .netScore(80)
                .build();

        passedReport = ScoreReportDTO.builder()
                .sessionId(passedSessionId)
                .traineeId("trn-01")
                .traineeName("Inspector NDRF Responder")
                .batchUnit("10th NDRF Battalion")
                .scenarioCode("CBRN-CHEM-01")
                .scenarioTitle("Chemical Spill Response")
                .startedAt(passedSession.getStartedAt())
                .completedAt(passedSession.getCompletedAt())
                .totalDurationSeconds(150)
                .finalScore(95)
                .passStatus("PASSED")
                .passed(true)
                .breakdown(breakdown)
                .mistakes(Collections.emptyList())
                .recommendations(Collections.emptyList())
                .build();

        failedReport = ScoreReportDTO.builder()
                .sessionId(failedSessionId)
                .traineeId("trn-02")
                .traineeName("Cadet Responder")
                .batchUnit("10th NDRF Battalion")
                .scenarioCode("CBRN-CHEM-01")
                .scenarioTitle("Chemical Spill Response")
                .startedAt(failedSession.getStartedAt())
                .completedAt(failedSession.getCompletedAt())
                .totalDurationSeconds(300)
                .finalScore(55)
                .passStatus("FAILED")
                .passed(false)
                .breakdown(breakdown)
                .mistakes(Collections.emptyList())
                .recommendations(Collections.emptyList())
                .build();
    }

    @Test
    void generateCertificatePdf_PassedSession_ReturnsValidPdfBytes() {
        when(sessionRepository.findById(passedSessionId)).thenReturn(Optional.of(passedSession));
        when(scoringService.previewScore(passedSessionId)).thenReturn(passedReport);

        byte[] pdfBytes = certificateService.generateCertificatePdf(passedSessionId);

        assertNotNull(pdfBytes, "PDF byte array should not be null");
        assertTrue(pdfBytes.length > 500, "PDF byte array should have meaningful size");

        // Verify PDF Magic Header (%PDF-)
        String header = new String(pdfBytes, 0, Math.min(pdfBytes.length, 5), StandardCharsets.US_ASCII);
        assertEquals("%PDF-", header, "Generated document must start with valid PDF magic bytes");
    }

    @Test
    void generateCertificatePdf_FailedSession_ThrowsIllegalStateException() {
        when(sessionRepository.findById(failedSessionId)).thenReturn(Optional.of(failedSession));
        when(scoringService.previewScore(failedSessionId)).thenReturn(failedReport);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                certificateService.generateCertificatePdf(failedSessionId)
        );

        assertTrue(ex.getMessage().contains("did not achieve the required passing threshold"));
    }

    @Test
    void generateCertificatePdf_NonExistentSession_ThrowsIllegalArgumentException() {
        when(sessionRepository.findById("sess-unknown")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                certificateService.generateCertificatePdf("sess-unknown")
        );

        assertTrue(ex.getMessage().contains("Session not found"));
    }

    @Test
    void computeVerificationHash_DeterministicAndNonEmpty() {
        String hash1 = certificateService.computeVerificationHash(passedReport);
        String hash2 = certificateService.computeVerificationHash(passedReport);

        assertNotNull(hash1);
        assertEquals(hash1, hash2, "Verification hash must be deterministic across identical report objects");
        assertEquals(64, hash1.length(), "SHA-256 hex digest must be exactly 64 characters");
    }
}

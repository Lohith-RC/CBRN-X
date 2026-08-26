package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.SquadComparisonDTO;
import com.cbrsx.backend.dto.SquadSummaryDTO;
import com.cbrsx.backend.entity.AuditLog;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.AuditLogRepository;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditAndSquadServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private TraineeRepository traineeRepository;

    @Test
    void auditLogService_logAction_PersistsCorrectAuditTrail() {
        AuditLogService auditLogService = new AuditLogService(auditLogRepository);

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        AuditLog log = auditLogService.logAction(
                "USER_LOGIN",
                "instructor_01",
                "/api/auth/login",
                "127.0.0.1",
                "SUCCESS",
                "Role: INSTRUCTOR"
        );

        assertNotNull(log.getAuditId());
        assertEquals("USER_LOGIN", log.getActionType());
        assertEquals("instructor_01", log.getActorUsername());
        assertEquals("SUCCESS", log.getStatus());
        assertEquals("127.0.0.1", log.getIpAddress());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void squadAnalyticsService_getSquadSummary_AggregatesSquadPerformance() {
        SquadAnalyticsService squadAnalyticsService = new SquadAnalyticsService(sessionRepository, traineeRepository);

        TrainingSession s1 = TrainingSession.builder()
                .sessionId("sess-1")
                .traineeId("trn-1")
                .squadId("alpha")
                .finalScore(90)
                .passStatus("PASSED")
                .startedAt(Instant.now())
                .build();

        TrainingSession s2 = TrainingSession.builder()
                .sessionId("sess-2")
                .traineeId("trn-2")
                .squadId("alpha")
                .finalScore(80)
                .passStatus("PASSED")
                .startedAt(Instant.now())
                .build();

        when(sessionRepository.findBySquadId("alpha")).thenReturn(List.of(s1, s2));

        Trainee t1 = Trainee.builder().traineeId("trn-1").name("Alpha Lead").batchUnit("10th NDRF Battalion").build();
        Trainee t2 = Trainee.builder().traineeId("trn-2").name("Alpha Containment").batchUnit("10th NDRF Battalion").build();

        when(traineeRepository.findAllById(Set.of("trn-1", "trn-2"))).thenReturn(List.of(t1, t2));

        SquadSummaryDTO summary = squadAnalyticsService.getSquadSummary("alpha");

        assertEquals("alpha", summary.getSquadId());
        assertEquals(2, summary.getActiveMembers());
        assertEquals(2, summary.getTotalSessions());
        assertEquals(2, summary.getPassedSessions());
        assertEquals(100.0, summary.getPassRate());
        assertEquals(85.0, summary.getAverageScore());
        assertEquals(2, summary.getMemberNames().size());
    }

    @Test
    void squadAnalyticsService_compareSquads_ReturnsComparativeSquadMetrics() {
        SquadAnalyticsService squadAnalyticsService = new SquadAnalyticsService(sessionRepository, traineeRepository);

        when(sessionRepository.findBySquadId("alpha")).thenReturn(Collections.emptyList());
        when(sessionRepository.findBySquadId("bravo")).thenReturn(Collections.emptyList());
        when(sessionRepository.findBySquadId("charlie")).thenReturn(Collections.emptyList());

        when(traineeRepository.findAllById(any())).thenReturn(Collections.emptyList());

        SquadComparisonDTO comparison = squadAnalyticsService.compareSquads();

        assertNotNull(comparison);
        assertEquals(3, comparison.getSquads().size());
        assertEquals(0.0, comparison.getOverallSquadAverage());
    }
}

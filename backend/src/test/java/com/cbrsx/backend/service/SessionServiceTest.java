package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.StartSessionRequest;
import com.cbrsx.backend.dto.StartSessionResponse;
import com.cbrsx.backend.entity.Scenario;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.EventRepository;
import com.cbrsx.backend.repository.ScenarioRepository;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private TraineeRepository traineeRepository;

    @Mock
    private ScenarioRepository scenarioRepository;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SessionService sessionService;

    private Scenario defaultScenario;

    @BeforeEach
    void setUp() {
        defaultScenario = Scenario.builder()
                .scenarioId("scen-chem-01")
                .code("CBRN-CHEM-01")
                .title("Chemical Spill Response")
                .maxScore(100)
                .build();
    }

    @Test
    @DisplayName("startSession: Creates session and emits start event for existing trainee")
    void startSession_ExistingTrainee_Success() {
        Trainee existingTrainee = Trainee.builder()
                .traineeId("trn-01")
                .name("Inspector Lohith")
                .batchUnit("NDRF 10th Battalion")
                .build();

        when(traineeRepository.findById("trn-01")).thenReturn(Optional.of(existingTrainee));
        when(scenarioRepository.findByCode("CBRN-CHEM-01")).thenReturn(Optional.of(defaultScenario));
        when(sessionRepository.save(any(TrainingSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StartSessionRequest request = StartSessionRequest.builder()
                .traineeId("trn-01")
                .traineeName("Inspector Lohith")
                .batchUnit("NDRF 10th Battalion")
                .scenarioCode("CBRN-CHEM-01")
                .build();

        StartSessionResponse response = sessionService.startSession(request);

        assertNotNull(response);
        assertNotNull(response.getSessionId());
        assertTrue(response.getSessionId().startsWith("sess-"));
        assertEquals("trn-01", response.getTraineeId());
        assertEquals("scen-chem-01", response.getScenarioId());
        assertEquals("Chemical Spill Response", response.getScenarioTitle());

        verify(eventRepository, times(1)).save(any());
        verify(sessionRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("startSession: Creates new trainee when traineeId is not found")
    void startSession_NewTrainee_ResolvesAndSaves() {
        when(traineeRepository.findById("trn-new-99")).thenReturn(Optional.empty());
        when(traineeRepository.saveAndFlush(any(Trainee.class))).thenAnswer(i -> i.getArgument(0));
        when(scenarioRepository.findByCode("CBRN-CHEM-01")).thenReturn(Optional.of(defaultScenario));
        when(sessionRepository.save(any(TrainingSession.class))).thenAnswer(i -> i.getArgument(0));

        StartSessionRequest request = StartSessionRequest.builder()
                .traineeId("trn-new-99")
                .traineeName("Chandana M P")
                .batchUnit("NDRF Unit 5")
                .scenarioCode("CBRN-CHEM-01")
                .build();

        StartSessionResponse response = sessionService.startSession(request);

        assertNotNull(response);
        assertEquals("trn-new-99", response.getTraineeId());
        verify(traineeRepository, times(1)).saveAndFlush(any(Trainee.class));
    }
}

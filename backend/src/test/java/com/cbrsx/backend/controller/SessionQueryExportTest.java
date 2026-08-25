package com.cbrsx.backend.controller;

import com.cbrsx.backend.entity.Scenario;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.ScenarioRepository;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the instructor session browser contract:
 * pagination cap, server-side CSV export (including the >100-row guarantee),
 * voided-session exclusion from the default listing, and RBAC on /export.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SessionQueryExportTest {

    private static final String SCENARIO_ID = "scen-export-it";
    private static final int PASSED_ROWS = 150;

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private SessionRepository sessionRepository;
    @Autowired
    private TraineeRepository traineeRepository;
    @Autowired
    private ScenarioRepository scenarioRepository;

    @BeforeEach
    void seed() {
        sessionRepository.deleteAll();
        traineeRepository.deleteAll();
        scenarioRepository.save(Scenario.builder()
                .scenarioId(SCENARIO_ID)
                .code("EXP-IT-01")
                .title("Export Integration Scenario")
                .description("seed")
                .maxScore(100)
                .build());
        traineeRepository.save(Trainee.builder()
                .traineeId("tr-exp-it").name("Exporter One").batchUnit("QA Unit").build());
        // Name containing a comma exercises server-side CSV quoting
        traineeRepository.save(Trainee.builder()
                .traineeId("tr-exp-csv").name("Exporter, Second").batchUnit("QA \"Unit\"").build());

        Instant base = Instant.parse("2026-01-01T00:00:00Z");
        for (int i = 0; i < PASSED_ROWS; i++) {
            String traineeId = i == 0 ? "tr-exp-csv" : "tr-exp-it";
            sessionRepository.save(TrainingSession.builder()
                    .sessionId("sess-exp-it-" + i)
                    .traineeId(traineeId)
                    .scenarioId(SCENARIO_ID)
                    .startedAt(base.plusSeconds(i * 10L))
                    .completedAt(base.plusSeconds(i * 10L + 60))
                    .finalScore(80)
                    .passStatus("PASSED")
                    .build());
        }
        sessionRepository.save(TrainingSession.builder()
                .sessionId("sess-exp-it-voided")
                .traineeId("tr-exp-it")
                .scenarioId(SCENARIO_ID)
                .startedAt(base.plusSeconds(9999))
                .completedAt(base.plusSeconds(10059))
                .finalScore(10)
                .passStatus("VOIDED")
                .build());
    }

    @Test
    void listEndpointCapsAtPageSizeAndReportsTrueTotal() throws Exception {
        mockMvc.perform(get("/api/sessions?page=0&size=100")
                        .with(SecurityMockMvcRequestPostProcessors.user("inst").roles("INSTRUCTOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(PASSED_ROWS))
                .andExpect(jsonPath("$.content.length()").value(100));
    }

    @Test
    void csvExportStreamsAllRowsBeyondPaginationCap() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/sessions/export")
                        .with(SecurityMockMvcRequestPostProcessors.user("inst").roles("INSTRUCTOR")))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        String[] lines = body.split("\r?\n");
        assertThat(lines).hasSize(PASSED_ROWS + 1); // header + all 150 rows
        assertThat(lines[0]).isEqualTo(
                "Session ID,Trainee ID,Trainee,Batch/Unit,Scenario,Score,Status,Started At,Completed At");
        assertThat(result.getResponse().getHeader("X-CBRSX-Truncated")).isEqualTo("false");
        assertThat(result.getResponse().getHeader("X-CBRSX-Total-Matching")).isEqualTo(String.valueOf(PASSED_ROWS));

        // Server-side CSV quoting of commas and quotes in cell values
        assertThat(body).contains("\"Exporter, Second\"");
        assertThat(body).contains("\"QA \"\"Unit\"\"\"");
    }

    @Test
    void defaultListingAndExportExcludeVoidedSessions() throws Exception {
        mockMvc.perform(get("/api/sessions?page=0&size=100")
                        .with(SecurityMockMvcRequestPostProcessors.user("inst").roles("INSTRUCTOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(PASSED_ROWS));

        MvcResult result = mockMvc.perform(get("/api/sessions/export?status=VOIDED")
                        .with(SecurityMockMvcRequestPostProcessors.user("inst").roles("INSTRUCTOR")))
                .andExpect(status().isOk())
                .andReturn();
        long dataLines = result.getResponse().getContentAsString().lines().count() - 1;
        assertThat(dataLines).isEqualTo(1);
        assertThat(result.getResponse().getContentAsString()).contains("sess-exp-it-voided");
    }

    @Test
    void traineeRoleIsForbiddenFromExport() throws Exception {
        mockMvc.perform(get("/api/sessions/export")
                        .with(SecurityMockMvcRequestPostProcessors.user("t").roles("TRAINEE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void csvExportNeutralizesFormulaInjection() throws Exception {
        traineeRepository.save(Trainee.builder()
                .traineeId("tr-formula-hack")
                .name("=cmd|'/C calc'!A1")
                .batchUnit("+123456")
                .build());
        sessionRepository.save(TrainingSession.builder()
                .sessionId("sess-formula-hack")
                .traineeId("tr-formula-hack")
                .scenarioId(SCENARIO_ID)
                .startedAt(Instant.now().minusSeconds(100))
                .completedAt(Instant.now())
                .finalScore(95)
                .passStatus("PASSED")
                .build());

        MvcResult result = mockMvc.perform(get("/api/sessions/export")
                        .with(SecurityMockMvcRequestPostProcessors.user("inst").roles("INSTRUCTOR")))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        // Leading '=' and '+' must be prefixed with a single quote to neutralize formula injection
        assertThat(body).contains("'=cmd|'/C calc'!A1");
        assertThat(body).contains("'+123456");
    }
}

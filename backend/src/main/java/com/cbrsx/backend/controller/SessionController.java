package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.EventTimelineEntry;
import com.cbrsx.backend.dto.PagedSessionsDTO;
import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.dto.SessionSummaryDTO;
import com.cbrsx.backend.dto.StartSessionRequest;
import com.cbrsx.backend.dto.StartSessionResponse;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.service.CertificateService;
import com.cbrsx.backend.service.ScoringService;
import com.cbrsx.backend.service.SessionQueryService;
import com.cbrsx.backend.service.SessionService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final ScoringService scoringService;
    private final CertificateService certificateService;
    private final SessionQueryService sessionQueryService;

    @GetMapping
    public ResponseEntity<PagedSessionsDTO> listSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(required = false) String traineeId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        PagedSessionsDTO sessions = sessionQueryService.getSessions(page, size, status, traineeId, q, from, to);
        return ResponseEntity.ok(sessions);
    }

    /**
     * Server-side CSV export of the current filter result set.
     *
     * Streams text/csv directly (no client-side JSON-to-CSV assembly) and
     * discloses truncation honestly: when the result set exceeds
     * SessionQueryService.CSV_EXPORT_MAX rows, only the newest CSV_EXPORT_MAX
     * are streamed, and the X-CBRSX-Truncated response header is set to true.
     */
    @GetMapping("/export")
    public void exportSessionsCsv(
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(required = false) String traineeId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            HttpServletResponse response) throws IOException {
        SessionQueryService.SessionExportResult result =
                sessionQueryService.exportRows(status, traineeId, q, from, to);

        String filename = "cbrsx-session-records-"
                + DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(ZoneOffset.UTC).format(Instant.now())
                + ".csv";

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("text/csv;charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        response.setHeader("X-CBRSX-Total-Matching", String.valueOf(result.totalMatching()));
        response.setHeader("X-CBRSX-Truncated", String.valueOf(result.truncated()));

        PrintWriter writer = response.getWriter();
        writer.println("Session ID,Trainee ID,Trainee,Batch/Unit,Scenario,Score,Status,Started At,Completed At");
        for (SessionSummaryDTO r : result.rows()) {
            writer.println(String.join(",",
                    csvCell(r.getSessionId()),
                    csvCell(r.getTraineeId()),
                    csvCell(r.getTraineeName()),
                    csvCell(r.getBatchUnit()),
                    csvCell(r.getScenarioTitle()),
                    r.getFinalScore() != null ? r.getFinalScore().toString() : "",
                    csvCell(r.getPassStatus()),
                    r.getStartedAt() != null ? r.getStartedAt().toString() : "",
                    r.getCompletedAt() != null ? r.getCompletedAt().toString() : ""));
        }
        writer.flush();
    }

    private static String csvCell(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        String sanitized = value;
        // [CBRN-SEC-03] Neutralize CSV formula injection (DDE / Excel formula injection)
        char firstChar = sanitized.charAt(0);
        if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r') {
            sanitized = "'" + sanitized;
        }
        return (sanitized.contains(",") || sanitized.contains("\"") || sanitized.contains("\n") || sanitized.contains("\r"))
                ? "\"" + sanitized.replace("\"", "\"\"") + "\""
                : sanitized;
    }

    @PostMapping("/start")
    public ResponseEntity<StartSessionResponse> startSession(@Valid @RequestBody StartSessionRequest request) {
        StartSessionResponse response = sessionService.startSession(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<ScoreReportDTO> completeSession(
            @PathVariable @Size(min = 5, max = 64) @Pattern(
                    regexp = "^[a-zA-Z0-9_-]+$",
                    message = "sessionId may only contain letters, digits, dashes and underscores"
            ) String sessionId) {
        ScoreReportDTO report = scoringService.finalizeSession(sessionId);
        return ResponseEntity.ok(report);
    }

    @PostMapping("/{sessionId}/void")
    public ResponseEntity<Map<String, Object>> voidSession(
            @PathVariable @Size(min = 5, max = 64) @Pattern(
                    regexp = "^[a-zA-Z0-9_-]+$",
                    message = "sessionId may only contain letters, digits, dashes and underscores"
            ) String sessionId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        TrainingSession voided = sessionService.voidSession(sessionId, reason);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", voided.getSessionId());
        response.put("passStatus", voided.getPassStatus());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{sessionId}/report")
    public ResponseEntity<ScoreReportDTO> getSessionReport(
            @PathVariable @Size(min = 5, max = 64) @Pattern(
                    regexp = "^[a-zA-Z0-9_-]+$",
                    message = "sessionId may only contain letters, digits, dashes and underscores"
            ) String sessionId) {
        sessionService.validateSessionAccess(sessionId);
        ScoreReportDTO report = scoringService.previewScore(sessionId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/{sessionId}/events")
    public ResponseEntity<List<EventTimelineEntry>> getSessionEvents(
            @PathVariable @Size(min = 5, max = 64) @Pattern(
                    regexp = "^[a-zA-Z0-9_-]+$",
                    message = "sessionId may only contain letters, digits, dashes and underscores"
            ) String sessionId) {
        sessionService.validateSessionAccess(sessionId);
        return ResponseEntity.ok(sessionService.getEventTimeline(sessionId));
    }

    @GetMapping("/{sessionId}/certificate")
    public ResponseEntity<byte[]> getSessionCertificate(
            @PathVariable @Size(min = 5, max = 64) @Pattern(
                    regexp = "^[a-zA-Z0-9_-]+$",
                    message = "sessionId may only contain letters, digits, dashes and underscores"
            ) String sessionId) {
        sessionService.validateSessionAccess(sessionId);
        byte[] pdfBytes = certificateService.generateCertificatePdf(sessionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"NDRF-Certificate-" + sessionId + ".pdf\"")
                .body(pdfBytes);
    }
}

package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.dto.StartSessionRequest;
import com.cbrsx.backend.dto.StartSessionResponse;
import com.cbrsx.backend.service.ScoringService;
import com.cbrsx.backend.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final ScoringService scoringService;

    @PostMapping("/start")
    public ResponseEntity<StartSessionResponse> startSession(@Valid @RequestBody StartSessionRequest request) {
        StartSessionResponse response = sessionService.startSession(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<ScoreReportDTO> completeSession(@PathVariable String sessionId) {
        ScoreReportDTO report = scoringService.finalizeSession(sessionId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/{sessionId}/report")
    public ResponseEntity<ScoreReportDTO> getSessionReport(@PathVariable String sessionId) {
        ScoreReportDTO report = scoringService.previewScore(sessionId);
        return ResponseEntity.ok(report);
    }
}

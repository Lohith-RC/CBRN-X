package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.dto.StartSessionRequest;
import com.cbrsx.backend.dto.StartSessionResponse;
import com.cbrsx.backend.service.ScoringService;
import com.cbrsx.backend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SessionController {

    private final SessionService sessionService;
    private final ScoringService scoringService;

    @PostMapping("/start")
    public ResponseEntity<StartSessionResponse> startSession(@RequestBody StartSessionRequest request) {
        StartSessionResponse response = sessionService.startSession(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<ScoreReportDTO> completeSession(@PathVariable String sessionId) {
        ScoreReportDTO report = scoringService.calculateAndFinalizeScore(sessionId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/{sessionId}/report")
    public ResponseEntity<ScoreReportDTO> getSessionReport(@PathVariable String sessionId) {
        ScoreReportDTO report = scoringService.calculateAndFinalizeScore(sessionId);
        return ResponseEntity.ok(report);
    }
}

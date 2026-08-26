package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.TraineeProgressionDTO;
import com.cbrsx.backend.service.TraineeAnalyticsService;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing longitudinal skill-growth tracking and multi-session analytics for trainees.
 */
@RestController
@RequestMapping("/api/trainees")
@RequiredArgsConstructor
public class TraineeController {

    private final TraineeAnalyticsService traineeAnalyticsService;

    @GetMapping("/{traineeId}/progress")
    public ResponseEntity<TraineeProgressionDTO> getTraineeProgress(
            @PathVariable @Size(min = 3, max = 64) @Pattern(
                    regexp = "^[a-zA-Z0-9_-]+$",
                    message = "traineeId may only contain letters, digits, dashes and underscores"
            ) String traineeId) {
        TraineeProgressionDTO progression = traineeAnalyticsService.getTraineeProgression(traineeId);
        return ResponseEntity.ok(progression);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<java.util.List<com.cbrsx.backend.dto.TraineeLeaderboardDTO>> getLeaderboard(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String batchUnit) {
        return ResponseEntity.ok(traineeAnalyticsService.getBattalionLeaderboard(batchUnit));
    }
}

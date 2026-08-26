package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.SquadComparisonDTO;
import com.cbrsx.backend.dto.SquadSummaryDTO;
import com.cbrsx.backend.service.SquadAnalyticsService;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/squads")
@RequiredArgsConstructor
public class SquadController {

    private final SquadAnalyticsService squadAnalyticsService;

    @GetMapping("/{squadId}/summary")
    public ResponseEntity<SquadSummaryDTO> getSquadSummary(
            @PathVariable @Size(min = 2, max = 64) @Pattern(
                    regexp = "^[a-zA-Z0-9_-]+$",
                    message = "squadId may only contain letters, digits, dashes and underscores"
            ) String squadId) {
        return ResponseEntity.ok(squadAnalyticsService.getSquadSummary(squadId));
    }

    @GetMapping("/compare")
    public ResponseEntity<SquadComparisonDTO> compareSquads() {
        return ResponseEntity.ok(squadAnalyticsService.compareSquads());
    }
}

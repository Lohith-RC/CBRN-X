package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.DebriefReportDTO;
import com.cbrsx.backend.service.DebriefService;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller providing tactical After-Action Review (AAR) and debrief analytics.
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class DebriefController {

    private final DebriefService debriefService;

    @GetMapping("/{sessionId}/debrief")
    public ResponseEntity<DebriefReportDTO> getSessionDebrief(
            @PathVariable @Size(min = 5, max = 64) @Pattern(
                    regexp = "^[a-zA-Z0-9_-]+$",
                    message = "sessionId may only contain letters, digits, dashes and underscores"
            ) String sessionId) {
        DebriefReportDTO debrief = debriefService.generateDebrief(sessionId);
        return ResponseEntity.ok(debrief);
    }
}

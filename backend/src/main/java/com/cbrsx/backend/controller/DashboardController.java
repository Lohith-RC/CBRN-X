package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.CohortAnalyticsDTO;
import com.cbrsx.backend.dto.DashboardStatsDTO;
import com.cbrsx.backend.service.CohortAnalyticsService;
import com.cbrsx.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final CohortAnalyticsService cohortAnalyticsService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        DashboardStatsDTO stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/cohort")
    public ResponseEntity<CohortAnalyticsDTO> getCohortAnalytics() {
        CohortAnalyticsDTO analytics = cohortAnalyticsService.getCohortAnalytics();
        return ResponseEntity.ok(analytics);
    }
}
